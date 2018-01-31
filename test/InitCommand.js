"use strict";

const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");

// mocked modules
const findUp = require("find-up");
const loadJsonFile = require("load-json-file");
const readPkg = require("read-pkg");
const writePkg = require("write-pkg");
const writeJsonFile = require("write-json-file");
const FileSystemUtilities = require("../src/FileSystemUtilities");
const GitUtilities = require("../src/GitUtilities");

// helpers
const initFixture = require("./helpers/initFixture");
const yargsRunner = require("./helpers/yargsRunner");

// file under test
const commandModule = require("../src/commands/InitCommand");

const run = yargsRunner(commandModule);
const lernaVersion = require("../package.json").version;

// from Repository
jest.mock("find-up");
jest.mock("load-json-file");
jest.mock("read-pkg");

// from InitCommand
jest.mock("write-json-file");
jest.mock("write-pkg");
jest.mock("../src/FileSystemUtilities");
jest.mock("../src/GitUtilities");

// silence logs
log.level = "silent";

describe("InitCommand", () => {
  beforeEach(() => {
    // defaults for most of these tests
    GitUtilities.isInitialized = jest.fn(() => true);
    FileSystemUtilities.existsSync = jest.fn(() => false);

    findUp.sync = jest.fn(() => null);
    loadJsonFile.sync = jest.fn(() => {
      throw new Error("ENOENT");
    });
    readPkg.sync = jest.fn(() => {
      throw new Error("ENOENT");
    });
  });

  afterEach(() => jest.resetAllMocks());

  describe("in an empty directory", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = tempy.directory();
      lernaInit = run(testDir);

      GitUtilities.isInitialized = jest.fn(() => false);
    });

    it("completely ignores validation and preparation lifecycle", async () => {
      await lernaInit();
    });

    it("initializes git repo with lerna files", async () => {
      await lernaInit();

      const execOpts = expect.objectContaining({
        cwd: testDir,
      });
      expect(GitUtilities.isInitialized).lastCalledWith(execOpts);
      expect(GitUtilities.init).lastCalledWith(execOpts);

      expect(writeJsonFile.sync).lastCalledWith(
        path.join(testDir, "lerna.json"),
        {
          packages: ["packages/*"],
          version: "0.0.0",
        },
        { indent: 2 }
      );

      expect(writePkg.sync).lastCalledWith(
        path.join(testDir, "package.json"),
        expect.objectContaining({
          devDependencies: {
            lerna: `^${lernaVersion}`,
          },
        })
      );

      expect(FileSystemUtilities.mkdirpSync).lastCalledWith(path.join(testDir, "packages"));
    });

    it("initializes git repo with lerna files in independent mode", async () => {
      await lernaInit("--independent");

      expect(writeJsonFile.sync).lastCalledWith(
        expect.stringContaining("lerna.json"),
        expect.objectContaining({
          version: "independent",
        }),
        { indent: 2 }
      );
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", async () => {
        await lernaInit("--exact");

        expect(writePkg.sync).lastCalledWith(
          expect.stringContaining("package.json"),
          expect.objectContaining({
            devDependencies: {
              lerna: lernaVersion,
            },
          })
        );
      });

      it("sets lerna.json command.init.exact to true", async () => {
        await lernaInit("--exact");

        expect(writeJsonFile.sync).lastCalledWith(
          expect.stringContaining("lerna.json"),
          expect.objectContaining({
            command: {
              init: {
                exact: true,
              },
            },
          }),
          { indent: 2 }
        );
      });
    });
  });

  describe("in a subdirectory of a git repo", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      const dir = tempy.directory();
      testDir = path.join(dir, "subdir");
      lernaInit = run(testDir);

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    });

    it("creates lerna files", async () => {
      await lernaInit();

      expect(GitUtilities.init).not.toBeCalled();

      expect(writeJsonFile.sync).lastCalledWith(
        path.join(testDir, "lerna.json"),
        {
          packages: ["packages/*"],
          version: "0.0.0",
        },
        { indent: 2 }
      );

      expect(writePkg.sync).lastCalledWith(
        path.join(testDir, "package.json"),
        expect.objectContaining({
          devDependencies: {
            lerna: `^${lernaVersion}`,
          },
        })
      );

      expect(FileSystemUtilities.mkdirpSync).lastCalledWith(path.join(testDir, "packages"));
    });
  });

  describe("when package.json exists", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/has-package");
      lernaInit = run(testDir);
    });

    it("adds lerna to sorted devDependencies", async () => {
      readPkg.sync = jest.fn(() => ({
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      }));

      await lernaInit();

      expect(writePkg.sync).lastCalledWith(
        path.join(testDir, "package.json"),
        expect.objectContaining({
          devDependencies: {
            alpha: "first",
            lerna: `^${lernaVersion}`,
            omega: "last",
          },
        })
      );
    });

    it("updates existing lerna in devDependencies", async () => {
      readPkg.sync = jest.fn(() => ({
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      }));

      await lernaInit();

      expect(writePkg.sync).lastCalledWith(
        path.join(testDir, "package.json"),
        expect.objectContaining({
          dependencies: {
            alpha: "first",
            omega: "last",
          },
          devDependencies: {
            lerna: `^${lernaVersion}`,
          },
        })
      );
    });

    it("updates existing lerna in sorted dependencies", async () => {
      readPkg.sync = jest.fn(() => ({
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      }));

      await lernaInit();

      expect(writePkg.sync).lastCalledWith(
        path.join(testDir, "package.json"),
        expect.objectContaining({
          dependencies: {
            alpha: "first",
            lerna: `^${lernaVersion}`,
            omega: "last",
          },
        })
      );
    });
  });

  describe("when lerna.json exists", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/has-lerna");
      lernaInit = run(testDir);

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    });

    it("deletes lerna property if found", async () => {
      loadJsonFile.sync = jest.fn(() => ({
        lerna: "0.1.100",
        version: "1.2.3",
      }));

      await lernaInit();

      expect(writeJsonFile.sync).lastCalledWith(
        expect.stringContaining("lerna.json"),
        {
          packages: ["packages/*"],
          version: "1.2.3",
        },
        { indent: 2 }
      );
    });

    it("creates package directories when glob is configured", async () => {
      loadJsonFile.sync = jest.fn(() => ({
        packages: ["modules/*"],
      }));

      await lernaInit();

      expect(FileSystemUtilities.mkdirpSync).lastCalledWith(path.join(testDir, "modules"));
    });
  });

  describe("when re-initializing with --exact", () => {
    let testDir;
    let lernaInit;

    beforeEach(async () => {
      testDir = await initFixture("InitCommand/updates");
      lernaInit = run(testDir);

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    });

    it("sets lerna.json commands.init.exact to true", async () => {
      loadJsonFile.sync = jest.fn(() => ({
        lerna: "0.1.100",
        commands: {
          bootstrap: {
            hoist: true,
          },
        },
        version: "1.2.3",
      }));

      readPkg.sync = jest.fn(() => ({
        devDependencies: {
          lerna: lernaVersion,
        },
      }));

      await lernaInit("--exact");

      expect(writeJsonFile.sync).lastCalledWith(
        expect.stringContaining("lerna.json"),
        expect.objectContaining({
          commands: {
            bootstrap: {
              hoist: true,
            },
            init: {
              exact: true,
            },
          },
        }),
        { indent: 2 }
      );
    });
  });
});
