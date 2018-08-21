"use strict";

jest.mock("@lerna/rimraf-dir");
jest.mock("@lerna/npm-install");
jest.mock("@lerna/run-lifecycle");
jest.mock("@lerna/create-symlink");

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const rimrafDir = require("@lerna/rimraf-dir");
const npmInstall = require("@lerna/npm-install");
const runLifecycle = require("@lerna/run-lifecycle");
const createSymlink = require("@lerna/create-symlink");
const hasNpmVersion = require("@lerna/has-npm-version");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");
const updateLernaConfig = require("@lerna-test/update-lerna-config");

// file under test
const lernaBootstrap = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const installedPackagesInDirectories = testDir =>
  npmInstall.dependencies.mock.calls.reduce((obj, [pkg, dependencies]) => {
    const relative = normalizeRelativeDir(testDir, pkg.location);
    obj[relative || "ROOT"] = dependencies;
    return obj;
  }, {});

const ranScriptsInDirectories = testDir =>
  runLifecycle.mock.calls.reduce((obj, [pkg, script]) => {
    const location = normalizeRelativeDir(testDir, pkg.location);

    if (!obj[location]) {
      obj[location] = [];
    }

    obj[location].push(`npm run ${script}`);

    return obj;
  }, {});

const removedDirectories = testDir =>
  rimrafDir.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

const symlinkedDirectories = testDir =>
  createSymlink.mock.calls
    .slice()
    // ensure sort is always consistent, despite promise variability
    .sort((a, b) => (b[0] === a[0] ? b[1] < a[1] : b[0] < a[0]))
    .map(([src, dest, type]) => ({
      _src: normalizeRelativeDir(testDir, src),
      dest: normalizeRelativeDir(testDir, dest),
      type,
    }));

describe("BootstrapCommand", () => {
  // stub rimraf because we trust isaacs
  rimrafDir.mockResolvedValue();

  // we stub npmInstall in most tests because
  // we already have enough tests of npmInstall
  npmInstall.mockResolvedValue();
  npmInstall.dependencies.mockResolvedValue();

  // stub runLifecycle because it is a huge source
  // of slowness when running tests for no good reason
  runLifecycle.mockResolvedValue();

  // the underlying implementation of symlinkBinary and symlinkDependencies
  createSymlink.mockResolvedValue();

  describe("lifecycle scripts", () => {
    it("should run preinstall, postinstall and prepublish scripts", async () => {
      const testDir = await initFixture("lifecycle-scripts");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });

    it("shouldn't run lifecycle scripts with --ignore-scripts", async () => {
      const testDir = await initFixture("ignored-scripts");

      await lernaBootstrap(testDir)("--ignore-scripts");

      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with hoisting", () => {
    it("should hoist", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();

      // root includes explicit dependencies and hoisted from leaves
      expect(npmInstall.dependencies).toBeCalledWith(
        expect.objectContaining({
          name: "basic",
        }),
        ["bar@^2.0.0", "foo@^1.0.0", "@test/package-1@^0.0.0"],
        {
          registry: undefined,
          npmClient: "npm",
          npmClientArgs: undefined,
          mutex: undefined,
          // npmGlobalStyle is not included at all
        }
      );

      // foo@0.1.2 differs from the more common foo@^1.0.0
      expect(npmInstall.dependencies).lastCalledWith(
        expect.objectContaining({
          name: "package-3",
        }),
        ["foo@0.1.12"],
        expect.objectContaining({
          npmGlobalStyle: true,
        })
      );
    });

    it("should not hoist when disallowed", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--hoist", "--nohoist", "@test/package-1");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not hoist when disallowed from lerna.json", async () => {
      const testDir = await initFixture("basic");

      await updateLernaConfig(testDir, {
        hoist: true,
        nohoist: ["@test/package-1"],
      });
      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --npm-client and --hoist", () => {
    it("should throw", async () => {
      expect.assertions(1);

      const testDir = await initFixture("yarn-hoist");

      try {
        await lernaBootstrap(testDir)();
      } catch (err) {
        expect(err.message).toMatch(
          "--hoist is not supported with --npm-client=yarn, use yarn workspaces instead"
        );
      }
    });
  });

  describe("with --ci", () => {
    it("should call npmInstall with ci subCommand if on npm 5.7.0 or later", async () => {
      const testDir = await initFixture("ci");

      await lernaBootstrap(testDir)("--ci");

      expect(hasNpmVersion).lastCalledWith(">=5.7.0");
      expect(npmInstall.dependencies.mock.calls[0][2]).toEqual({
        subCommand: "ci",
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: undefined,
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });

    it("should not pass subCommand to npmInstall if on npm version earlier than 5.7.0", async () => {
      const testDir = await initFixture("ci");

      hasNpmVersion.mockReturnValue(false);

      await lernaBootstrap(testDir)("--ci");

      expect(npmInstall.dependencies.mock.calls[0][2]).toEqual({
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: undefined,
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });

    it("respects config file { ci: false }", async () => {
      const testDir = await initFixture("ci");

      await updateLernaConfig(testDir, {
        command: {
          bootstrap: {
            ci: false,
          },
        },
      });
      await lernaBootstrap(testDir)();

      expect(hasNpmVersion).not.toBeCalled();
      expect(npmInstall.dependencies.mock.calls[0][2]).toEqual({
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: undefined,
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });
  });

  describe("with local package dependencies", () => {
    it("should bootstrap packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("should only bootstrap scoped packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("never installs with global style", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).toBeCalledWith(
        expect.objectContaining({
          name: "@test/package-2",
        }),
        expect.arrayContaining(["foo@^1.0.0"]),
        expect.objectContaining({
          npmGlobalStyle: false,
        })
      );
    });
  });

  describe("with multiple package locations", () => {
    it("should bootstrap packages", async () => {
      const testDir = await initFixture("extra");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      const testDir = await initFixture("extra");

      await lernaBootstrap(testDir)("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies not included by --scope with --include-filtered-dependencies", async () => {
      const testDir = await initFixture("extra");

      // we scope to package-2 only but should still install package-1 as it is a dependency of package-2
      await lernaBootstrap(testDir)("--scope", "package-2", "--include-filtered-dependencies");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies excluded by --ignore with --include-filtered-dependencies", async () => {
      const testDir = await initFixture("extra");

      // we ignore package 1 but it should still be installed because it is a dependency of package-2
      await lernaBootstrap(testDir)(
        "--ignore",
        "{@test/package-1,package-@(3|4)}",
        "--include-filtered-dependencies"
      );

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("extra");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with external dependencies that haven't been installed", () => {
    it("should get installed", async () => {
      const testDir = await initFixture("cold");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("gets network mutex when --npm-client=yarn", async () => {
      const testDir = await initFixture("cold");

      await lernaBootstrap(testDir)("--npm-client", "yarn");

      expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: expect.stringMatching(/^network:\d+$/),
      });
    });

    it("gets user defined mutex when --npm-client=yarn", async () => {
      const testDir = await initFixture("cold");

      await lernaBootstrap(testDir)("--npm-client", "yarn", "--mutex", "file:/test/this/path");

      expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: "file:/test/this/path",
      });
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("cold");

      await updateLernaConfig(testDir, {
        hoist: true,
      });
      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with external dependencies that have already been installed", () => {
    it("should not get re-installed", async () => {
      const testDir = await initFixture("warm");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("warm");

      await updateLernaConfig(testDir, {
        command: {
          bootstrap: {
            hoist: true,
          },
        },
      });
      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with at least one external dependency to install", () => {
    it("should install all dependencies", async () => {
      const testDir = await initFixture("tepid");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("tepid");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with package peerDependencies", () => {
    it("does not bootstrap peerDependencies", async () => {
      const testDir = await initFixture("peer");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
    });
  });

  describe("with registry config", () => {
    it("should install packages from registry", async () => {
      const testDir = await initFixture("registries");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(npmInstall.dependencies).lastCalledWith(
        expect.objectContaining({
          name: "@test/package-1",
        }),
        expect.arrayContaining(["foo@^1.0.0"]),
        expect.objectContaining({
          registry: "https://my-secure-registry/npm",
          npmClient: "npm",
          npmGlobalStyle: false,
        })
      );
    });
  });

  describe("with remaining arguments", () => {
    describe("by default", () => {
      it("should turn it into npmClientArgs", async () => {
        const testDir = await initFixture("npm-client-args-1");

        await lernaBootstrap(testDir)("--", "--no-optional", "--production");

        expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--no-optional", "--production"],
        });
      });
    });

    describe("and configured npmClientArgs option", () => {
      it("should merge both together", async () => {
        const testDir = await initFixture("npm-client-args-2");

        await lernaBootstrap(testDir)("--", "--no-optional");

        expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--production", "--no-optional"],
        });
      });
    });
  });

  describe("with yarn workspaces", () => {
    it("should use workspaces feature when installing", async () => {
      const testDir = await initFixture("yarn-workspaces");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
      expect(npmInstall).lastCalledWith(
        expect.objectContaining({ name: "root" }),
        expect.objectContaining({
          npmClient: "yarn",
          mutex: expect.stringMatching(/^network:\d+$/),
        })
      );
    });

    it("errors when package.json workspaces exists but --use-workspaces is not enabled", async () => {
      expect.assertions(1);

      const testDir = await initFixture("yarn-workspaces");

      try {
        await lernaBootstrap(testDir)("--no-use-workspaces");
      } catch (err) {
        expect(err.message).toMatch(
          "Yarn workspaces are configured in package.json, but not enabled in lerna.json!"
        );
      }
    });
  });

  describe("with relative file: specifiers in root dependencies", () => {
    it("only installs in the root", async () => {
      const testDir = await initFixture("relative-file-specs");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
      expect(npmInstall).lastCalledWith(
        expect.objectContaining({ name: "relative-file-specs" }),
        expect.objectContaining({
          npmClient: "npm",
          stdio: "inherit",
        })
      );
    });
  });

  describe("with duplicate package names", () => {
    it("throws an error", async () => {
      expect.assertions(1);

      const testDir = await initFixture("duplicate-package-names");

      try {
        await lernaBootstrap(testDir)();
      } catch (err) {
        expect(err.message).toMatch(`Package name "package-1" used in multiple packages`);
      }
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      const testDir = await initFixture("toposort");

      try {
        await lernaBootstrap(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });

  it("succeeds in repositories with zero packages", async () => {
    const testDir = await initFixture("zero-pkgs");

    const result = await lernaBootstrap(testDir)();

    // cheesy workaround for jest's expectation of assertions
    expect(result).toBeDefined();
  });

  it("does not require an initialized git repo", async () => {
    const testDir = await initFixture("zero-pkgs");

    await fs.remove(path.join(testDir, ".git"));

    const result = await lernaBootstrap(testDir)();

    // cheesy workaround for jest's expectation of assertions
    expect(result).toBeDefined();
  });

  it("requires a git repo when using --since", async () => {
    expect.assertions(1);
    const testDir = await initFixture("zero-pkgs");

    await fs.remove(path.join(testDir, ".git"));

    try {
      await lernaBootstrap(testDir)("--since", "some-branch");
    } catch (err) {
      expect(err.message).toMatch("this is not a git repository");
    }
  });
});
