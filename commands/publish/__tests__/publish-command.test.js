"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
jest.mock("../lib/get-unpublished-packages");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");
jest.mock("../../version/lib/remote-branch-exists");

// mocked or stubbed modules
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const packDirectory = require("@lerna/pack-directory");
const PromptUtilities = require("@lerna/prompt");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");
const checkWorkingTree = require("@lerna/check-working-tree");
const getNpmUsername = require("../lib/get-npm-username");
const verifyNpmPackageAccess = require("../lib/verify-npm-package-access");
const getUnpublishedPackages = require("../lib/get-unpublished-packages");
const Project = require("@lerna/project");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const gitTag = require("@lerna-test/git-tag");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

expect.extend(require("@lerna-test/figgy-pudding-matchers"));

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

    ["from-git", "from-package"].forEach(fromArg => {
      it(`exits early when no changes found ${fromArg}`, async () => {
        collectUpdates.setUpdated(cwd);

        await lernaPublish(cwd)(fromArg);

        const logMessages = loggingOutput("success");
        expect(logMessages).toContain("No changed packages to publish");
        expect(verifyNpmPackageAccess).not.toHaveBeenCalled();
      });
    });

    it("exits non-zero with --scope", async () => {
      try {
        await lernaPublish(cwd)("--scope", "package-1");
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe("Unknown argument: scope");
      }

      expect.assertions(2);
    });

    it("exits non-zero with --since", async () => {
      try {
        await lernaPublish(cwd)("--since", "master");
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe("Unknown argument: since");
      }

      expect.assertions(2);
    });
  });

  describe("with implied versioning", () => {
    it("publishes changed packages", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)();

      expect(PromptUtilities.confirm).toHaveBeenLastCalledWith(
        "Are you sure you want to publish these packages?"
      );
      expect(packDirectory.registry).toMatchInlineSnapshot(`
Set {
  "package-1",
  "package-3",
  "package-4",
  "package-2",
}
`);
      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
      expect(npmDistTag.remove).not.toHaveBeenCalled();
      expect(npmDistTag.add).not.toHaveBeenCalled();

      expect(getNpmUsername).toHaveBeenCalled();
      expect(getNpmUsername).toHaveBeenLastCalledWith(
        expect.figgyPudding({ registry: "https://registry.npmjs.org/" })
      );

      expect(verifyNpmPackageAccess).toHaveBeenCalled();
      expect(verifyNpmPackageAccess).toHaveBeenLastCalledWith(
        expect.any(Array),
        expect.figgyPudding({ registry: "https://registry.npmjs.org/" })
      );
    });

    it("publishes changed independent packages", async () => {
      const testDir = await initFixture("independent");

      await lernaPublish(testDir)();

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
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

      try {
        await lernaPublish(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }

      expect.assertions(1);
    });
  });

  describe("from-git", () => {
    it("publishes tagged packages", async () => {
      const testDir = await initFixture("normal");

      await gitTag(testDir, "v1.0.0");
      await lernaPublish(testDir)("from-git");

      // called from chained describeRef()
      expect(checkWorkingTree.throwIfUncommitted).toHaveBeenCalled();

      expect(PromptUtilities.confirm).toHaveBeenLastCalledWith(
        "Are you sure you want to publish these packages?"
      );
      expect(output.logged()).toMatch("Found 4 packages to publish:");
      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("publishes tagged independent packages", async () => {
      const testDir = await initFixture("independent");

      await Promise.all([
        gitTag(testDir, "package-1@1.0.0"),
        gitTag(testDir, "package-2@2.0.0"),
        gitTag(testDir, "package-3@3.0.0"),
        gitTag(testDir, "package-4@4.0.0"),
        gitTag(testDir, "package-5@5.0.0"),
      ]);
      await lernaPublish(testDir)("from-git");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("only publishes independent packages with matching tags", async () => {
      const testDir = await initFixture("independent");

      await gitTag(testDir, "package-3@3.0.0");
      await lernaPublish(testDir)("from-git");

      expect(output.logged()).toMatch("Found 1 package to publish:");
      expect(npmPublish.order()).toEqual(["package-3"]);
    });

    it("exits early when the current commit is not tagged", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)("from-git");

      expect(npmPublish).not.toHaveBeenCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("No tagged release found");
    });

    it("throws an error when uncommitted changes are present", async () => {
      checkWorkingTree.throwIfUncommitted.mockImplementationOnce(() => {
        throw new Error("uncommitted");
      });

      const testDir = await initFixture("normal");

      try {
        await lernaPublish(testDir)("from-git");
      } catch (err) {
        expect(err.message).toBe("uncommitted");
        // notably different than the actual message, but good enough here
      }

      expect.assertions(1);
    });
  });

  describe("from-package", () => {
    it("publishes unpublished packages", async () => {
      const testDir = await initFixture("normal");
      const project = new Project(testDir);

      getUnpublishedPackages.mockImplementationOnce(async () => {
        const pkgs = await project.getPackages();
        return pkgs.slice(1, 3);
      });

      await lernaPublish(testDir)("from-package");

      expect(PromptUtilities.confirm).toHaveBeenLastCalledWith(
        "Are you sure you want to publish these packages?"
      );
      expect(output.logged()).toMatch("Found 2 packages to publish:");
      expect(npmPublish.order()).toEqual(["package-2", "package-3"]);
    });

    it("publishes unpublished independent packages", async () => {
      const testDir = await initFixture("independent");
      const project = new Project(testDir);

      getUnpublishedPackages.mockImplementationOnce(() => project.getPackages());

      await lernaPublish(testDir)("from-package");

      expect(npmPublish.order()).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
        // package-5 is private
      ]);
    });

    it("exits early when all packages are published", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)("from-package");

      expect(npmPublish).not.toHaveBeenCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("No unpublished release found");
    });

    it("throws an error when uncommitted changes are present", async () => {
      checkWorkingTree.throwIfUncommitted.mockImplementationOnce(() => {
        throw new Error("uncommitted");
      });

      const testDir = await initFixture("normal");

      try {
        await lernaPublish(testDir)("from-package");
      } catch (err) {
        expect(err.message).toBe("uncommitted");
        // notably different than the actual message, but good enough here
      }

      expect.assertions(1);
    });
  });

  describe("--registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-private-registry";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "latest", // dist-tag
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ registry })
      );
    });

    it("overwrites yarn registry proxy with https://registry.npmjs.org/", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://registry.yarnpkg.com";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        "latest", // dist-tag
        "/TEMP_DIR/package-1-MOCKED.tgz",
        expect.objectContaining({ registry: "https://registry.npmjs.org/" })
      );

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain("Yarn's registry proxy is broken, replacing with public npm registry");
      expect(logMessages).toContain("If you don't have an npm token, you should exit and run `npm login`");
    });
  });

  describe("--no-verify-access", () => {
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

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("toposort");

        await lernaPublish(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
