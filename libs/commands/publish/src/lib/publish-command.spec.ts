import {
  collectUpdates as _collectUpdates,
  getOneTimePassword as _getOneTimePassword,
  npmDistTag as _npmDistTag,
  npmPublish as _npmPublish,
  packDirectory as _packDirectory,
  promptConfirmation as _promptConfirmation,
} from "@lerna/core";
import { commandRunner, commitChangeToPackage, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fsmain from "fs";
import fs from "fs-extra";
import path from "path";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// lerna publish mocks
jest.mock("./get-packages-without-license", () => ({
  getPackagesWithoutLicense: jest.fn().mockResolvedValue([]),
}));
jest.mock("./verify-npm-package-access", () => ({
  verifyNpmPackageAccess: jest.fn(() => Promise.resolve()),
}));
jest.mock("./get-npm-username", () => ({
  getNpmUsername: jest.fn(() => Promise.resolve("lerna-test")),
}));
jest.mock("./get-two-factor-auth-required");
jest.mock("./get-unpublished-packages", () => ({
  getUnpublishedPackages: jest.fn(() => Promise.resolve([])),
}));
jest.mock("./git-checkout");

// lerna version mocks
setupLernaVersionMocks();

const promptConfirmation = jest.mocked(_promptConfirmation);
const getOneTimePassword = jest.mocked(_getOneTimePassword);
const npmDistTag = jest.mocked(_npmDistTag);

// The mock differs from the real thing
const npmPublish = _npmPublish as any;
const collectUpdates = _collectUpdates as any;
const packDirectory = _packDirectory as any;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getNpmUsername } = require("./get-npm-username");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { verifyNpmPackageAccess } = require("./verify-npm-package-access");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getTwoFactorAuthRequired } = require("./get-two-factor-auth-required");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitCheckout } = require("./git-checkout");

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

gitCheckout.mockImplementation(() => Promise.resolve());

describe("PublishCommand", () => {
  describe("cli validation", () => {
    let cwd;

    beforeAll(async () => {
      cwd = await initFixture("normal");
    });

    it("exits early when no changes found", async () => {
      collectUpdates.setUpdated(cwd);

      await lernaPublish(cwd)();

      const logMessages = loggingOutput("success");
      expect(logMessages).toContain("No changed packages to publish");
      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });

    it("exits non-zero with --scope", async () => {
      const command = lernaPublish(cwd)("--scope", "package-1");

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          exitCode: 1,
          message: "Unknown argument: scope",
        })
      );
    });

    it("exits non-zero with --since", async () => {
      const command = lernaPublish(cwd)("--since", "main");

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          exitCode: 1,
          message: "Unknown argument: since",
        })
      );
    });

    it("errors when --git-head is passed without from-package positional", async () => {
      const command = lernaPublish(cwd)("--git-head", "deadbeef");

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          name: "ValidationError",
          message: "--git-head is only allowed with 'from-package' positional",
        })
      );
    });
  });

  describe("with implied versioning", () => {
    it("publishes changed packages", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)();

      expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
      expect(packDirectory.registry).toMatchInlineSnapshot(`
Set {
  "package-1",
  "package-4",
  "package-2",
  "package-3",
}
`);
      expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "package-1" => "latest",
  "package-4" => "latest",
  "package-2" => "latest",
  "package-3" => "latest",
}
`);
      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-4",
        "package-2",
        "package-3",
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).not.toHaveBeenCalled();
      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: true },
        { cwd: testDir }
      );
    });

    it("publishes changed independent packages", async () => {
      const testDir = await initFixture("independent");

      await lernaPublish(testDir)();

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-4",
        "package-2",
        "package-3",
        // package-5 is private
      ]);
    });

    it("--skip-npm yields immediately to VersionCommand with warning", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--skip-npm");

      expect(npmPublish.order()).toHaveLength(0);

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain("Instead of --skip-npm, call `lerna version` directly");
    });

    it("throws an error in fixed mode when --independent is passed", async () => {
      const testDir = await initFixture("normal");
      const command = lernaPublish(testDir)("--independent");

      await expect(command).rejects.toThrow("independent");
    });
  });

  describe("--graph-type", () => {
    it("produces a topological ordering that _includes_ devDependencies when value is not set", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)();

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-4",
        "package-2",
        // package-3 has a peer/devDependency on package-2
        "package-3",
        // package-5 is private
      ]);
    });

    it("produces a topological ordering that _includes_ devDependencies when value is 'all'", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--graph-type", "all");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-4",
        "package-2",
        // package-3 has a peer/devDependency on package-2
        "package-3",
        // package-5 is private
      ]);
    });

    it("produces a topological ordering that _excludes_ devDependencies when value is 'dependencies' (DEPRECATED)", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--graph-type", "dependencies");

      expect(npmPublish.order()).toEqual([
        "package-1",
        // package-3 has a peer/devDependency on package-2
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);

      const logMessages = loggingOutput("warn");
      expect(logMessages).toMatchInlineSnapshot(`
        Array [
          "--graph-type=dependencies is deprecated and will be removed in lerna v6. If you have a use-case you feel requires it please open an issue to discuss: https://github.com/lerna/lerna/issues/new/choose",
        ]
      `);
    });

    it("throws an error when value is _not_ 'all' or 'dependencies'", async () => {
      const testDir = await initFixture("normal");
      const command = lernaPublish(testDir)("--graph-type", "poopy-pants");

      await expect(command).rejects.toThrow("poopy-pants");
    });
  });

  describe("--no-sort", () => {
    it("produces a lexical ordering when --no-sort is set", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--no-sort");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-2",
        "package-3",
        "package-4",
        // package-5 is private
      ]);
    });
  });

  describe("--otp", () => {
    getOneTimePassword.mockImplementation(() => Promise.resolve("654321"));

    it("passes one-time password to npm commands", async () => {
      const testDir = await initFixture("normal");
      const otp = "123456";

      // cli option skips prompt
      getTwoFactorAuthRequired.mockResolvedValueOnce(true);

      await lernaPublish(testDir)("--otp", otp);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ otp }),
        expect.objectContaining({ otp })
      );
      expect(getOneTimePassword).not.toHaveBeenCalled();
    });

    it("prompts for OTP when option missing, account-level 2FA enabled, and verify access is true", async () => {
      const testDir = await initFixture("normal");

      getTwoFactorAuthRequired.mockResolvedValueOnce(true);

      await lernaPublish(testDir)("--verify-access", true);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ otp: "654321" })
      );
      expect(getOneTimePassword).toHaveBeenLastCalledWith("Enter OTP:");
    });

    it("defers OTP prompt when option missing, account-level 2FA enabled, and verify access is not true", async () => {
      const testDir = await initFixture("normal");

      getTwoFactorAuthRequired.mockResolvedValueOnce(true);

      await lernaPublish(testDir)();

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ otp: undefined }),
        expect.objectContaining({ otp: undefined })
      );
      expect(getOneTimePassword).not.toHaveBeenCalled();
    });
  });

  describe("--legacy-auth", () => {
    it("passes auth to npm commands", async () => {
      const testDir = await initFixture("normal");
      const data = "hi:mom";
      const auth = Buffer.from(data).toString("base64");

      await lernaPublish(testDir)("--legacy-auth", auth);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ "auth-type": "legacy", _auth: auth }),
        expect.objectContaining({ otp: undefined })
      );
    });
  });

  describe("--registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-private-registry";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ registry }),
        expect.objectContaining({ otp: undefined })
      );
    });

    it("overwrites yarn registry proxy with https://registry.npmjs.org/", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://registry.yarnpkg.com";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ registry: "https://registry.npmjs.org/" }),
        expect.objectContaining({ otp: undefined })
      );

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain("Yarn's registry proxy is broken, replacing with public npm registry");
      expect(logMessages).toContain("If you don't have an npm token, you should exit and run `npm login`");
    });

    it("skips validation on any other third-party registry", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-incompatible-registry.com";

      await lernaPublish(testDir)("--registry", registry);

      const logMessages = loggingOutput("notice");
      expect(logMessages).toContain("Skipping all user and access validation due to third-party registry");
    });
  });

  describe("--summary-file", () => {
    it("skips creating the summary file", async () => {
      const cwd = await initFixture("normal");
      const fsSpy = jest.spyOn(fs, "writeFileSync");
      await lernaPublish(cwd);

      expect(fsSpy).not.toHaveBeenCalled();
    });

    it("creates the summary file within the provided directory", async () => {
      const cwd = await initFixture("normal");
      const fsSpy = jest.spyOn(fsmain, "writeFileSync");
      await lernaPublish(cwd)("--summary-file", "./outputs");

      const expectedJsonResponse = [
        { packageName: "package-1", version: "1.0.1" },
        { packageName: "package-2", version: "1.0.1" },
        { packageName: "package-3", version: "1.0.1" },
        { packageName: "package-4", version: "1.0.1" },
      ];
      expect(fsSpy).toHaveBeenCalled();
      expect(fsSpy).toHaveBeenCalledWith(
        "./outputs/lerna-publish-summary.json",
        JSON.stringify(expectedJsonResponse)
      );
    });

    it("creates the summary file at the root when no custom directory is provided", async () => {
      const cwd = await initFixture("normal");
      const fsSpy = jest.spyOn(fsmain, "writeFileSync");
      await lernaPublish(cwd)("--summary-file");

      const expectedJsonResponse = [
        { packageName: "package-1", version: "1.0.1" },
        { packageName: "package-2", version: "1.0.1" },
        { packageName: "package-3", version: "1.0.1" },
        { packageName: "package-4", version: "1.0.1" },
      ];
      expect(fsSpy).toHaveBeenCalled();
      expect(fsSpy).toHaveBeenCalledWith(
        "./lerna-publish-summary.json",
        JSON.stringify(expectedJsonResponse)
      );
    });
  });
  describe("--verify-access", () => {
    it("publishes packages after verifying the user's access to each package", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)("--verify-access");

      expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
      expect(packDirectory.registry).toMatchInlineSnapshot(`
Set {
  "package-1",
  "package-4",
  "package-2",
  "package-3",
}
`);
      expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "package-1" => "latest",
  "package-4" => "latest",
  "package-2" => "latest",
  "package-3" => "latest",
}
`);
      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-4",
        "package-2",
        "package-3",
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).toHaveBeenCalled();
      expect(getNpmUsername).toHaveBeenLastCalledWith(
        expect.objectContaining({ registry: "https://registry.npmjs.org/" })
      );

      expect(verifyNpmPackageAccess).toHaveBeenCalled();
      expect(verifyNpmPackageAccess).toHaveBeenLastCalledWith(
        expect.any(Array),
        "lerna-test",
        expect.objectContaining({ registry: "https://registry.npmjs.org/" })
      );

      expect(getTwoFactorAuthRequired).toHaveBeenCalled();
      expect(getTwoFactorAuthRequired).toHaveBeenLastCalledWith(expect.objectContaining({ otp: undefined }));

      expect(gitCheckout).toHaveBeenCalledWith(
        expect.any(Array),
        { granularPathspec: true },
        { cwd: testDir }
      );
    });
  });

  describe("--no-verify-access", () => {
    it("shows warning that this is the default behavior and that this option is no longer needed", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--no-verify-access");

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain(
        "--verify-access=false and --no-verify-access are no longer needed, because the legacy preemptive access verification is now disabled by default. Requests will fail with appropriate errors when not authorized correctly."
      );
    });

    it("skips package access verification", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--no-verify-access");

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });

    it("is implied when npm username is undefined", async () => {
      getNpmUsername.mockImplementationOnce(() => Promise.resolve());

      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--registry", "https://my-private-registry");

      expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
    });
  });

  describe("--no-git-reset", () => {
    it("skips git checkout of package manifests", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--no-git-reset");

      expect(gitCheckout).not.toHaveBeenCalled();
    });
  });

  // TODO: (major) make --no-granular-pathspec the default
  describe("--no-granular-pathspec", () => {
    it("resets staged changes globally", async () => {
      const cwd = await initFixture("normal");

      await lernaPublish(cwd)("--no-granular-pathspec");

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: false },
        { cwd }
      );
    });

    it("consumes configuration from lerna.json", async () => {
      const cwd = await initFixture("normal");

      await fs.outputJSON(path.join(cwd, "lerna.json"), {
        version: "1.0.0",
        granularPathspec: false,
      });
      await lernaPublish(cwd)();

      expect(gitCheckout).toHaveBeenCalledWith(
        // the list of changed files has been asserted many times already
        expect.any(Array),
        { granularPathspec: false },
        { cwd }
      );
    });
  });

  describe("--contents", () => {
    it("allows you to do fancy angular crap", async () => {
      const cwd = await initFixture("lifecycle");

      await lernaPublish(cwd)("--contents", "dist");

      const [[pkgOne, dirOne, opts], [pkgTwo, dirTwo]] = packDirectory.mock.calls;

      // second argument to packDirectory() is the location, _not_ the contents
      expect(dirOne).toBe(pkgOne.location);
      expect(dirTwo).toBe(pkgTwo.location);

      expect(pkgOne.contents).toBe(path.join(pkgOne.location, "dist"));
      expect(pkgTwo.contents).toBe(path.join(pkgTwo.location, "dist"));

      // opts is a snapshot of npm-conf instance
      expect(packDirectory).toHaveBeenCalledWith(pkgOne, dirOne, opts);
      expect(packDirectory).toHaveBeenCalledWith(pkgTwo, dirTwo, opts);
    });
  });

  describe("publishConfig.directory", () => {
    it("mimics effect of --contents, but per-package", async () => {
      const cwd = await initFixture("lifecycle");

      await commitChangeToPackage(cwd, "package-1", "chore: setup", {
        publishConfig: {
          directory: "dist",
        },
      });

      await lernaPublish(cwd)();

      expect(packDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "package-1",
          contents: path.join(cwd, "packages/package-1/dist"),
        }),
        path.join(cwd, "packages/package-1"),
        expect.any(Object)
      );
      expect(packDirectory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "package-2",
          contents: path.join(cwd, "packages/package-2"),
        }),
        path.join(cwd, "packages/package-2"),
        expect.any(Object)
      );
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      const testDir = await initFixture("toposort");
      const command = lernaPublish(testDir)("--reject-cycles");

      await expect(command).rejects.toThrow("Dependency cycles detected, you should fix these!");
    });
  });
});
