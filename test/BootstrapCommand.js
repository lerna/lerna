import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";
import NpmUtilities from "../src/NpmUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/BootstrapCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/NpmUtilities");

// silence logs
log.level = "silent";

// stub rimraf because we trust isaacs
const fsRimraf = FileSystemUtilities.rimraf;
const resetRimraf = () => {
  FileSystemUtilities.rimraf = fsRimraf;
};
const stubRimraf = () => {
  FileSystemUtilities.rimraf = jest.fn(callsBack());
};

// stub symlink in certain tests to reduce redundancy
const fsSymlink = FileSystemUtilities.symlink;
const resetSymlink = () => {
  FileSystemUtilities.symlink = fsSymlink;
};
const stubSymlink = () => {
  FileSystemUtilities.symlink = jest.fn(callsBack());
};

// object snapshots have sorted keys
const installedPackagesInDirectories = testDir =>
  NpmUtilities.installInDir.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[0]);
    const dependencies = args[1];
    obj[location || "ROOT"] = dependencies;
    return obj;
  }, {});

const ranScriptsInDirectories = testDir =>
  NpmUtilities.runScriptInDir.mock.calls.reduce((obj, args) => {
    const location = normalizeRelativeDir(testDir, args[1].directory);
    const script = args[0];

    if (!obj[location]) {
      obj[location] = [];
    }
    obj[location].push(script);

    return obj;
  }, {});

const removedDirectories = testDir =>
  FileSystemUtilities.rimraf.mock.calls.map(args => normalizeRelativeDir(testDir, args[0]));

const symlinkedDirectories = testDir =>
  FileSystemUtilities.symlink.mock.calls.map(args => ({
    _src: normalizeRelativeDir(testDir, args[0]),
    dest: normalizeRelativeDir(testDir, args[1]),
    type: args[2],
  }));

describe("BootstrapCommand", () => {
  beforeEach(() => {
    // we stub installInDir() in most tests because
    // we already have enough tests of installInDir()
    NpmUtilities.installInDir.mockImplementation(callsBack());
    NpmUtilities.installInDirOriginalPackageJson.mockImplementation(callsBack());

    // stub runScriptInDir() because it is a huge source
    // of slowness when running tests for no good reason
    NpmUtilities.runScriptInDir.mockImplementation(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("lifecycle scripts", () => {
    it("should run preinstall, postinstall and prepublish scripts", async () => {
      const testDir = await initFixture("BootstrapCommand/lifecycle-scripts");
      const lernaBootstrap = run(testDir);
      await lernaBootstrap();

      expect(NpmUtilities.installInDir).not.toBeCalled();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });

    it("shouldn't run lifecycle scripts with --ignore-scripts", async () => {
      const testDir = await initFixture("BootstrapCommand/ignored-scripts");
      const lernaBootstrap = run(testDir);
      await lernaBootstrap("--ignore-scripts");

      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with hoisting", () => {
    let testDir;
    let lernaBootstrap;

    beforeEach(async () => {
      testDir = await initFixture("BootstrapCommand/basic");
      lernaBootstrap = run(testDir);
    });

    beforeEach(stubRimraf);
    afterEach(resetRimraf);

    it("should hoist", async () => {
      await lernaBootstrap("--hoist");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();

      // root includes explicit dependencies and hoisted from leaves
      expect(NpmUtilities.installInDir).toBeCalledWith(
        testDir,
        ["bar@^2.0.0", "foo@^1.0.0", "@test/package-1@^0.0.0"],
        {
          registry: undefined,
          npmClient: undefined,
          npmClientArgs: undefined,
          mutex: undefined,
          // npmGlobalStyle is not included at all
        },
        expect.any(Function)
      );

      // foo@0.1.2 differs from the more common foo@^1.0.0
      expect(NpmUtilities.installInDir).lastCalledWith(
        expect.stringContaining("package-3"),
        ["foo@0.1.12"],
        expect.objectContaining({
          npmGlobalStyle: true,
        }),
        expect.any(Function)
      );
    });

    it("should not hoist when disallowed", async () => {
      await lernaBootstrap("--hoist", "--nohoist", "@test/package-1");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(removedDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with --npm-client and --hoist", () => {
    it("should throw", async () => {
      expect.assertions(1);

      const testDir = await initFixture("BootstrapCommand/yarn-hoist");
      const lernaBootstrap = run(testDir);

      try {
        await lernaBootstrap();
      } catch (err) {
        expect(err.message).toMatch(
          "--hoist is not supported with --npm-client=yarn, use yarn workspaces instead"
        );
      }
    });
  });

  describe("with local package dependencies", () => {
    let testDir;
    let lernaBootstrap;

    beforeEach(async () => {
      testDir = await initFixture("BootstrapCommand/basic");
      lernaBootstrap = run(testDir);
    });

    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should bootstrap packages", async () => {
      await lernaBootstrap();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      await lernaBootstrap("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("should only bootstrap scoped packages", async () => {
      await lernaBootstrap("--scope", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("never installs with global style", async () => {
      await lernaBootstrap();

      expect(NpmUtilities.installInDir).toBeCalledWith(
        expect.any(String),
        expect.arrayContaining(["foo@^1.0.0"]),
        expect.objectContaining({
          npmGlobalStyle: false,
        }),
        expect.any(Function)
      );
    });
  });

  describe("with multiple package locations", () => {
    let testDir;
    let lernaBootstrap;

    beforeEach(async () => {
      testDir = await initFixture("BootstrapCommand/extra");
      lernaBootstrap = run(testDir);
    });

    beforeEach(stubSymlink);
    afterEach(resetSymlink);

    it("should bootstrap packages", async () => {
      await lernaBootstrap();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(ranScriptsInDirectories(testDir)).toMatchSnapshot();
      expect(symlinkedDirectories(testDir)).toMatchSnapshot();
    });

    it("should not bootstrap ignored packages", async () => {
      await lernaBootstrap("--ignore", "package-@(3|4)");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies not included by --scope with --include-filtered-dependencies", async () => {
      // we scope to package-2 only but should still install package-1 as it is a dependency of package-2
      await lernaBootstrap("--scope", "package-2", "--include-filtered-dependencies");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("bootstraps dependencies excluded by --ignore with --include-filtered-dependencies", async () => {
      // we ignore package 1 but it should still be installed because it is a dependency of package-2
      await lernaBootstrap("--ignore", "{@test/package-1,package-@(3|4)}", "--include-filtered-dependencies");

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with external dependencies that haven't been installed", () => {
    let testDir;
    let lernaBootstrap;

    beforeEach(async () => {
      testDir = await initFixture("BootstrapCommand/cold");
      lernaBootstrap = run(testDir);
    });

    it("should get installed", async () => {
      await lernaBootstrap();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });

    it("gets network mutex when --npm-client=yarn", async () => {
      await lernaBootstrap("--npm-client", "yarn");

      expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: expect.stringMatching(/^network:\d+$/),
      });
    });

    it("gets user defined mutex when --npm-client=yarn", async () => {
      await lernaBootstrap("--npm-client", "yarn", "--mutex", "file:/test/this/path");

      expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
        npmClient: "yarn",
        mutex: "file:/test/this/path",
      });
    });
  });

  describe("with external dependencies that have already been installed", () => {
    it("should not get re-installed", async () => {
      const testDir = await initFixture("BootstrapCommand/warm");
      const lernaBootstrap = run(testDir);

      await lernaBootstrap();

      expect(NpmUtilities.installInDir).not.toBeCalled();
    });
  });

  describe("with at least one external dependency to install", () => {
    it("should install all dependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/tepid");
      const lernaBootstrap = run(testDir);

      await lernaBootstrap();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
    });
  });

  describe("with package peerDependencies", () => {
    it("does not bootstrap peerDependencies", async () => {
      const testDir = await initFixture("BootstrapCommand/peer");
      const lernaBootstrap = run(testDir);

      await lernaBootstrap();

      expect(NpmUtilities.installInDir).not.toBeCalled();
    });
  });

  describe("zero packages", () => {
    it("should succeed in repositories with zero packages", async () => {
      const testDir = await initFixture("BootstrapCommand/zero-pkgs");
      const lernaBootstrap = run(testDir);

      const { exitCode } = await lernaBootstrap();

      expect(exitCode).toBe(0);
    });
  });

  describe("with registry config", () => {
    it("should install packages from registry", async () => {
      const testDir = await initFixture("BootstrapCommand/registries");
      const lernaBootstrap = run(testDir);

      await lernaBootstrap();

      expect(installedPackagesInDirectories(testDir)).toMatchSnapshot();
      expect(NpmUtilities.installInDir).lastCalledWith(
        expect.any(String),
        expect.arrayContaining(["foo@^1.0.0"]),
        expect.objectContaining({
          registry: "https://my-secure-registry/npm",
          npmClient: undefined,
          npmGlobalStyle: false,
        }),
        expect.any(Function)
      );
    });
  });

  describe("with remaining arguments", () => {
    describe("by default", () => {
      it("should turn it into npmClientArgs", async () => {
        const testDir = await initFixture("BootstrapCommand/npm-client-args-1");
        const lernaBootstrap = run(testDir);

        await lernaBootstrap("--", "--no-optional", "--production");

        expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--no-optional", "--production"],
        });
      });
    });

    describe("and configured npmClientArgs option", () => {
      it("should merge both together", async () => {
        const testDir = await initFixture("BootstrapCommand/npm-client-args-2");
        const lernaBootstrap = run(testDir);

        await lernaBootstrap("--", "--no-optional");

        expect(NpmUtilities.installInDir.mock.calls[0][2]).toMatchObject({
          npmClientArgs: ["--production", "--no-optional"],
        });
      });
    });
  });

  describe("with yarn workspaces", () => {
    it("should use workspaces feature when installing", async () => {
      const testDir = await initFixture("BootstrapCommand/yarn-workspaces");
      const lernaBootstrap = run(testDir);

      await lernaBootstrap();

      expect(NpmUtilities.installInDir).not.toBeCalled();
      expect(NpmUtilities.installInDirOriginalPackageJson).lastCalledWith(
        expect.any(String),
        expect.objectContaining({
          npmClient: "yarn",
          mutex: expect.stringMatching(/^network:\d+$/),
        }),
        expect.any(Function)
      );
    });

    it("errors when package.json workspaces exists but --use-workspaces is not enabled", async () => {
      expect.assertions(1);

      const testDir = await initFixture("BootstrapCommand/yarn-workspaces");
      const lernaBootstrap = run(testDir);

      try {
        await lernaBootstrap("--no-use-workspaces");
      } catch (err) {
        expect(err.message).toMatch(
          "Yarn workspaces are configured in package.json, but not enabled in lerna.json!"
        );
      }
    });
  });
});
