import {
  createSymlink as _createSymlink,
  hasNpmVersion as _hasNpmVersion,
  npmInstall as _npmInstall,
  npmInstallDependencies as _npmInstallDependencies,
  rimrafDir as _rimrafDir,
  runLifecycle as _runLifecycle,
} from "@lerna/core";
import {
  commandRunner,
  initFixtureFactory,
  normalizeRelativeDir,
  updateLernaConfig,
} from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const npmInstall = jest.mocked(_npmInstall);
const npmInstallDependencies = jest.mocked(_npmInstallDependencies);
const rimrafDir = jest.mocked(_rimrafDir);
const createSymlink = jest.mocked(_createSymlink);
const hasNpmVersion = jest.mocked(_hasNpmVersion);

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaBootstrap = commandRunner(require("../command"));

// The mocked runLifecycle is a little different than the real thing
const runLifecycle = _runLifecycle as any;

// assertion helpers
const installedPackagesInDirectories = (testDir) =>
  npmInstallDependencies.mock.calls.reduce((obj, [pkg, dependencies]) => {
    const relative = normalizeRelativeDir(testDir, pkg.location);
    obj[relative || "ROOT"] = dependencies;
    return obj;
  }, {});

const removedDirectories = (testDir) =>
  rimrafDir.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

const symlinkedDirectories = (testDir) =>
  createSymlink.mock.calls
    .slice()
    // ensure sort is always consistent, despite promise variability
    .sort((a, b) => {
      // two-dimensional path sort
      if (b[0] === a[0]) {
        if (b[1] === a[1]) {
          // ignore third field
          return 0;
        }

        return b[1] < a[1] ? 1 : -1;
      }

      return b[0] < a[0] ? 1 : -1;
    })
    .map(([src, dest, type]) => ({
      _src: normalizeRelativeDir(testDir, src),
      dest: normalizeRelativeDir(testDir, dest),
      type,
    }));

describe("BootstrapCommand", () => {
  beforeEach(() => {
    jest.setTimeout(60000);
  });

  // stub rimraf because we trust isaacs
  rimrafDir.mockResolvedValue(undefined);

  // we stub npmInstall in most tests because
  // we already have enough tests of npmInstall
  npmInstall.mockResolvedValue(undefined);
  npmInstallDependencies.mockResolvedValue();

  // stub runLifecycle because it is a huge source
  // of slowness when running tests for no good reason
  runLifecycle.mockResolvedValue(undefined);

  // the underlying implementation of symlinkBinary and symlinkDependencies
  createSymlink.mockResolvedValue();

  describe("lifecycle scripts", () => {
    const npmLifecycleEvent = process.env.npm_lifecycle_event;

    afterEach(() => {
      process.env.npm_lifecycle_event = npmLifecycleEvent;
      delete process.env.LERNA_EXEC_PATH;
      delete process.env.LERNA_ROOT_PATH;
    });

    it("should run preinstall, postinstall and prepublish scripts", async () => {
      const testDir = await initFixture("lifecycle-scripts");

      await lernaBootstrap(testDir)();

      expect(runLifecycle.getOrderedCalls()).toEqual([
        ["package-preinstall", "preinstall"],
        ["package-postinstall", "postinstall"],
        ["package-prepublish", "prepublish"],
      ]);
    });

    it("does not run prepublish scripts with --ignore-prepublish", async () => {
      const testDir = await initFixture("lifecycle-scripts");

      await lernaBootstrap(testDir)("--ignore-prepublish");

      expect(runLifecycle.getOrderedCalls()).toEqual([
        ["package-preinstall", "preinstall"],
        ["package-postinstall", "postinstall"],
      ]);
    });

    it("shouldn't run lifecycle scripts with --ignore-scripts", async () => {
      const testDir = await initFixture("ignored-scripts");

      await lernaBootstrap(testDir)("--ignore-scripts");

      expect(runLifecycle).not.toHaveBeenCalled();
      expect(npmInstallDependencies).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "package-prepare",
        }),
        ["tiny-tarball@^1.0.0"],
        expect.objectContaining({
          npmClientArgs: ["--ignore-scripts"],
        })
      );
    });

    it("should not recurse from hoisted root lifecycle", async () => {
      const testDir = await initFixture("lifecycle-scripts");

      process.env.LERNA_EXEC_PATH = testDir;
      process.env.LERNA_ROOT_PATH = testDir;

      await lernaBootstrap(testDir)();

      expect(runLifecycle).not.toHaveBeenCalled();
    });
  });

  describe("with pnpm", () => {
    it("should throw validation error", async () => {
      const testDir = await initFixture("pnpm");
      const command = lernaBootstrap(testDir)();

      await expect(command).rejects.toThrow(
        "Bootstrapping with pnpm is not supported. Use pnpm directly to manage dependencies: https://pnpm.io/cli/install"
      );
    });
  });

  describe("with hoisting", () => {
    it("should hoist", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();

      // root includes explicit dependencies and hoisted from leaves
      expect(npmInstallDependencies).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "basic",
        }),
        ["bar@^2.0.0", "foo@^1.0.0", "@test/package-1@^0.0.0"],
        {
          registry: undefined,
          npmClient: "npm",
          npmClientArgs: [],
          mutex: undefined,
          // npmGlobalStyle is not included at all
        }
      );

      // foo@0.1.2 differs from the more common foo@^1.0.0
      expect(npmInstallDependencies).toHaveBeenLastCalledWith(
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

      updateLernaConfig(testDir, {
        hoist: true,
        nohoist: ["@test/package-1"],
      });
      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --npm-client and --hoist", () => {
    it("should throw", async () => {
      const testDir = await initFixture("yarn-hoist");
      const command = lernaBootstrap(testDir)();

      await expect(command).rejects.toThrow(
        "--hoist is not supported with --npm-client=yarn, use yarn workspaces instead"
      );
    });
  });

  describe("with --hoist and --strict", () => {
    it("should throw if there's a hoist warning", async () => {
      const testDir = await initFixture("basic");
      const command = lernaBootstrap(testDir)("--hoist", "--strict");

      await expect(command).rejects.toThrow("Package version inconsistencies found");
    });
  });

  describe("with --ci", () => {
    it("should call npmInstall with ci subCommand if on npm 5.7.0 or later", async () => {
      const testDir = await initFixture("ci");

      await lernaBootstrap(testDir)("--ci");

      expect(hasNpmVersion).toHaveBeenLastCalledWith(">=5.7.0");
      expect(npmInstallDependencies.mock.calls[0][2]).toEqual({
        subCommand: "ci",
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: [],
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });

    it("should not pass subCommand to npmInstall if on npm version earlier than 5.7.0", async () => {
      const testDir = await initFixture("ci");

      hasNpmVersion.mockReturnValueOnce(false);

      await lernaBootstrap(testDir)("--ci");

      expect(npmInstallDependencies.mock.calls[0][2]).toEqual({
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: [],
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });

    it("should not run npm ci when hoisting", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--hoist", "package-*", "--ci");

      expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
        subCommand: "install", // not "ci"
        npmClient: "npm",
        npmClientArgs: ["--no-save"],
      });
    });

    it("respects config file { ci: false }", async () => {
      const testDir = await initFixture("ci");

      updateLernaConfig(testDir, {
        command: {
          bootstrap: {
            ci: false,
          },
        },
      });
      await lernaBootstrap(testDir)();

      expect(hasNpmVersion).not.toHaveBeenCalled();
      expect(npmInstallDependencies.mock.calls[0][2]).toEqual({
        registry: undefined,
        npmClient: "npm",
        npmClientArgs: [],
        npmGlobalStyle: false,
        mutex: undefined,
      });
    });
  });

  // TODO: troubleshoot and reenable
  describe.skip("with local package dependencies", () => {
    // TODO: troubleshoot and reenable
    it.skip("should bootstrap packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--ignore", "{@test/package-2,package-4}");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should only bootstrap scoped packages", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should respect --force-local", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "@test/package-1", "--scope", "package-4", "--force-local");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should respect --force-local when a single package is in scope", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "package-4", "--force-local");

      // no packages were installed from the registry
      const installed = installedPackagesInDirectories(testDir);
      expect(installed["packages/package-4"] || []).toEqual([]);

      // package-3 was resolved as a local symlink
      const symlinked = symlinkedDirectories(testDir);
      expect(symlinked).toContainEqual({
        _src: "packages/package-3",
        dest: "packages/package-4/node_modules/package-3",
        type: "junction",
      });
    });

    it("should respect --contents argument during linking step", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--contents", "dist");

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not update package.json when filtering", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "@test/package-2", "--ci");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
      expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
        subCommand: "install", // not "ci"
        npmClient: "npm",
        npmClientArgs: ["--no-save"],
      });
    });

    it("should not update yarn.lock when filtering", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)("--scope", "@test/package-2", "--npm-client", "yarn", "--ci");

      expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        npmClientArgs: ["--pure-lockfile"],
      });
    });

    it("never installs with global style", async () => {
      const testDir = await initFixture("basic");

      await lernaBootstrap(testDir)();

      expect(npmInstallDependencies).toHaveBeenCalledWith(
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
    // TODO: troubleshoot and reenable
    it.skip("should bootstrap packages", async () => {
      const testDir = await initFixture("extra");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
      expect(runLifecycle.getOrderedCalls()).toEqual([["@test/package-1", "prepublish"]]);
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

    // TODO: troubleshoot and reenable
    it.skip("hoists appropriately", async () => {
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

      expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: expect.stringMatching(/^network:\d+$/),
      });
    });

    it("gets user defined mutex when --npm-client=yarn", async () => {
      const testDir = await initFixture("cold");

      await lernaBootstrap(testDir)("--npm-client", "yarn", "--mutex", "file:/test/this/path");

      expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: "file:/test/this/path",
      });
    });

    // TODO: troubleshoot and reenable
    it.skip("hoists appropriately", async () => {
      const testDir = await initFixture("cold");

      updateLernaConfig(testDir, {
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

      expect(npmInstallDependencies).not.toHaveBeenCalled();
    });

    // TODO: troubleshoot and reenable
    it.skip("hoists appropriately", async () => {
      const testDir = await initFixture("warm");

      updateLernaConfig(testDir, {
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

      expect(npmInstallDependencies).not.toHaveBeenCalled();
    });
  });

  describe("with registry config", () => {
    it("should install packages from registry", async () => {
      const testDir = await initFixture("registries");

      await lernaBootstrap(testDir)();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(npmInstallDependencies).toHaveBeenLastCalledWith(
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

        expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--no-optional", "--production"],
        });
      });
    });

    describe("and configured npmClientArgs option", () => {
      it("should merge both together", async () => {
        const testDir = await initFixture("npm-client-args-2");

        await lernaBootstrap(testDir)("--", "--no-optional");

        expect(npmInstallDependencies.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--production", "--no-optional"],
        });
      });
    });
  });

  describe("with yarn workspaces", () => {
    it("should use workspaces feature when installing", async () => {
      const testDir = await initFixture("yarn-workspaces");

      await lernaBootstrap(testDir)();

      expect(npmInstallDependencies).not.toHaveBeenCalled();
      expect(npmInstall).toHaveBeenLastCalledWith(
        expect.objectContaining({ name: "root" }),
        expect.objectContaining({
          npmClient: "yarn",
          mutex: expect.stringMatching(/^network:\d+$/),
        })
      );
    });

    it("errors when package.json workspaces exists but --use-workspaces is not enabled", async () => {
      const testDir = await initFixture("yarn-workspaces");
      const command = lernaBootstrap(testDir)("--no-use-workspaces");

      await expect(command).rejects.toThrow(
        "Yarn workspaces are configured in package.json, but not enabled in lerna.json!"
      );
    });
  });

  describe("with relative file: specifiers in root dependencies", () => {
    it("only installs in the root", async () => {
      const testDir = await initFixture("relative-file-specs");

      await lernaBootstrap(testDir)();

      expect(npmInstallDependencies).not.toHaveBeenCalled();
      expect(npmInstall).toHaveBeenLastCalledWith(
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
      const testDir = await initFixture("duplicate-package-names");
      const command = lernaBootstrap(testDir)();

      await expect(command).rejects.toThrow(`Package name "package-1" used in multiple packages`);
    });
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      const testDir = await initFixture("toposort");
      const command = lernaBootstrap(testDir)("--reject-cycles");

      await expect(command).rejects.toThrow("Dependency cycles detected, you should fix these!");
    });
    it("should throw an error with --reject-cycles when using yarn-workspaces", async () => {
      const testDir = await initFixture("yarn-workspaces-cyclic");
      const command = lernaBootstrap(testDir)("--reject-cycles");

      await expect(command).rejects.toThrow("Dependency cycles detected, you should fix these!");
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
    const testDir = await initFixture("zero-pkgs");

    await fs.remove(path.join(testDir, ".git"));

    const command = lernaBootstrap(testDir)("--since", "some-branch");

    await expect(command).rejects.toThrow("this is not a git repository");
  });

  describe("with force-local", () => {
    // TODO: troubleshoot and reenable
    it.skip("links all packages", async () => {
      const testDir = await initFixture("force-local");

      await lernaBootstrap(testDir)("--force-local");

      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });
  });
});
