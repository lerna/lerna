"use strict";

jest.mock("../src/utils/npm-install");
jest.mock("../src/utils/npm-lifecycle");
jest.mock("../src/utils/create-symlink");

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const FileSystemUtilities = require("../src/FileSystemUtilities");
const npmInstall = require("../src/utils/npm-install");
const npmLifecycle = require("../src/utils/npm-lifecycle");
const createSymlink = require("../src/utils/create-symlink");

// helpers
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaBootstrap = require("./helpers/command-runner")(require("../src/commands/BootstrapCommand"));

// assertion helpers
const installedPackagesInDirectories = testDir =>
  npmInstall.dependencies.mock.calls.reduce((obj, [pkg, dependencies]) => {
    const relative = normalizeRelativeDir(testDir, pkg.location);
    obj[relative || "ROOT"] = dependencies;
    return obj;
  }, {});

const ranScriptsInDirectories = testDir =>
  npmLifecycle.mock.calls.reduce((obj, [pkg, script]) => {
    const location = normalizeRelativeDir(testDir, pkg.location);

    if (!obj[location]) {
      obj[location] = [];
    }

    obj[location].push(`npm run ${script}`);

    return obj;
  }, {});

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
  // we stub npmInstall in most tests because
  // we already have enough tests of npmInstall
  npmInstall.mockResolvedValue();
  npmInstall.dependencies.mockResolvedValue();

  // stub npmLifecycle because it is a huge source
  // of slowness when running tests for no good reason
  npmLifecycle.mockResolvedValue();

  // the underlying implementation of symlinkBinary and symlinkDependencies
  createSymlink.mockResolvedValue();

  describe("lifecycle scripts", () => {
    it("should run preinstall, postinstall and prepublish scripts", async () => {
      const testDir = await initFixture("BootstrapCommand/lifecycle-scripts");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });

    it("shouldn't run lifecycle scripts with --ignore-scripts", async () => {
      const testDir = await initFixture("BootstrapCommand/ignored-scripts");

      await lernaBootstrap(testDir)("--ignore-scripts");

      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with hoisting", () => {
    // stub rimraf because we trust isaacs
    const fsRimraf = FileSystemUtilities.rimraf;

    beforeEach(() => {
      FileSystemUtilities.rimraf = jest.fn(() => Promise.resolve());
    });

    afterEach(() => {
      FileSystemUtilities.rimraf = fsRimraf;
    });

    const removedDirectories = testDir =>
      FileSystemUtilities.rimraf.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

    it("should hoist", async () => {
      const testDir = await initFixture("BootstrapCommand/basic");

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
      const testDir = await initFixture("BootstrapCommand/basic");

      await lernaBootstrap(testDir)("--hoist", "--nohoist", "@test/package-1");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --npm-client and --hoist", () => {
    it("should throw", async () => {
      expect.assertions(1);

      const testDir = await initFixture("BootstrapCommand/yarn-hoist");

      try {
        await lernaBootstrap(testDir)();
      } catch (err) {
        expect(err.message).toMatch(
          "--hoist is not supported with --npm-client=yarn, use yarn workspaces instead"
        );
      }
    });
  });

  describe("with local package dependencies", () => {
    it("should bootstrap packages", async () => {
      const testDir = await initFixture("BootstrapCommand/basic");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      const testDir = await initFixture("BootstrapCommand/basic");

      await lernaBootstrap(testDir)("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("should only bootstrap scoped packages", async () => {
      const testDir = await initFixture("BootstrapCommand/basic");

      await lernaBootstrap(testDir)("--scope", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("never installs with global style", async () => {
      const testDir = await initFixture("BootstrapCommand/basic");

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
      const testDir = await initFixture("BootstrapCommand/extra");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      const testDir = await initFixture("BootstrapCommand/extra");

      await lernaBootstrap(testDir)("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies not included by --scope with --include-filtered-dependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/extra");

      // we scope to package-2 only but should still install package-1 as it is a dependency of package-2
      await lernaBootstrap(testDir)("--scope", "package-2", "--include-filtered-dependencies");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies excluded by --ignore with --include-filtered-dependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/extra");

      // we ignore package 1 but it should still be installed because it is a dependency of package-2
      await lernaBootstrap(testDir)(
        "--ignore",
        "{@test/package-1,package-@(3|4)}",
        "--include-filtered-dependencies"
      );

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("BootstrapCommand/extra");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with external dependencies that haven't been installed", () => {
    it("should get installed", async () => {
      const testDir = await initFixture("BootstrapCommand/cold");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("gets network mutex when --npm-client=yarn", async () => {
      const testDir = await initFixture("BootstrapCommand/cold");

      await lernaBootstrap(testDir)("--npm-client", "yarn");

      expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: expect.stringMatching(/^network:\d+$/),
      });
    });

    it("gets user defined mutex when --npm-client=yarn", async () => {
      const testDir = await initFixture("BootstrapCommand/cold");

      await lernaBootstrap(testDir)("--npm-client", "yarn", "--mutex", "file:/test/this/path");

      expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: "file:/test/this/path",
      });
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("BootstrapCommand/cold");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with external dependencies that have already been installed", () => {
    it("should not get re-installed", async () => {
      const testDir = await initFixture("BootstrapCommand/warm");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("BootstrapCommand/warm");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with at least one external dependency to install", () => {
    it("should install all dependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/tepid");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("hoists appropriately", async () => {
      const testDir = await initFixture("BootstrapCommand/tepid");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with package peerDependencies", () => {
    it("does not bootstrap peerDependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/peer");

      await lernaBootstrap(testDir)();

      expect(npmInstall.dependencies).not.toBeCalled();
    });
  });

  describe("with registry config", () => {
    it("should install packages from registry", async () => {
      const testDir = await initFixture("BootstrapCommand/registries");

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
        const testDir = await initFixture("BootstrapCommand/npm-client-args-1");

        await lernaBootstrap(testDir)("--", "--no-optional", "--production");

        expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--no-optional", "--production"],
        });
      });
    });

    describe("and configured npmClientArgs option", () => {
      it("should merge both together", async () => {
        const testDir = await initFixture("BootstrapCommand/npm-client-args-2");

        await lernaBootstrap(testDir)("--", "--no-optional");

        expect(npmInstall.dependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--production", "--no-optional"],
        });
      });
    });
  });

  describe("with yarn workspaces", () => {
    it("should use workspaces feature when installing", async () => {
      const testDir = await initFixture("BootstrapCommand/yarn-workspaces");

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

      const testDir = await initFixture("BootstrapCommand/yarn-workspaces");

      try {
        await lernaBootstrap(testDir)("--no-use-workspaces");
      } catch (err) {
        expect(err.message).toMatch(
          "Yarn workspaces are configured in package.json, but not enabled in lerna.json!"
        );
      }
    });
  });

  describe("with duplicate package names", () => {
    it("throws an error", async () => {
      expect.assertions(1);

      const testDir = await initFixture("BootstrapCommand/duplicate-package-names");

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

      const testDir = await initFixture("PackageUtilities/toposort");

      try {
        await lernaBootstrap(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });

  it("succeeds in repositories with zero packages", async () => {
    const testDir = await initFixture("BootstrapCommand/zero-pkgs");

    const result = await lernaBootstrap(testDir)();

    // cheesy workaround for jest's expectation of assertions
    expect(result).toBeDefined();
  });

  it("does not require an initialized git repo", async () => {
    const testDir = await initFixture("BootstrapCommand/zero-pkgs");

    fs.remove(path.join(testDir, ".git"));

    const result = await lernaBootstrap(testDir)();

    // cheesy workaround for jest's expectation of assertions
    expect(result).toBeDefined();
  });
});
