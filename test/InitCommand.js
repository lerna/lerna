import log from "npmlog";
import path from "path";
import tempy from "tempy";

// mocked modules
import findUp from "find-up";
import loadJsonFile from "load-json-file";
import readPkg from "read-pkg";
import writePkg from "write-pkg";
import writeJsonFile from "write-json-file";
import FileSystemUtilities from "../src/FileSystemUtilities";
import GitUtilities from "../src/GitUtilities";

// helpers
import initFixture from "./helpers/initFixture";

// file under test
import InitCommand from "../src/commands/InitCommand";

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

const initEmptyDir = () => tempy.directoryAsync();

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

    beforeEach(() => initEmptyDir().then((dir) => {
      testDir = dir;

      GitUtilities.isInitialized = jest.fn(() => false);
    }));

    it("completely ignores validation and preparation lifecycle", () => {
      const instance = new InitCommand([], {}, testDir);

      expect(() => instance.runValidations()).not.toThrow();
      expect(() => instance.runPreparations()).not.toThrow();
    });

    it("initializes git repo with lerna files", (done) => {
      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          const execOpts = expect.objectContaining({
            cwd: testDir,
          });
          expect(GitUtilities.isInitialized).lastCalledWith(execOpts);
          expect(GitUtilities.init).lastCalledWith(execOpts);

          expect(writeJsonFile.sync).lastCalledWith(
            path.join(testDir, "lerna.json"),
            {
              lerna: instance.lernaVersion,
              packages: ["packages/*"],
              version: "0.0.0",
            },
            { indent: 2 }
          );

          expect(writePkg.sync).lastCalledWith(
            path.join(testDir, "package.json"),
            expect.objectContaining({
              devDependencies: {
                lerna: `^${instance.lernaVersion}`,
              },
            })
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("initializes git repo with lerna files in independent mode", (done) => {
      const instance = new InitCommand([], {
        independent: true,
      }, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writeJsonFile.sync).lastCalledWith(
            expect.stringContaining("lerna.json"),
            expect.objectContaining({
              version: "independent",
            }),
            { indent: 2 }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", (done) => {
        const instance = new InitCommand([], {
          exact: true,
        }, testDir);

        instance.runCommand((err, code) => {
          if (err) return done.fail(err);

          try {
            expect(code).toBe(0);

            expect(writePkg.sync).lastCalledWith(
              expect.stringContaining("package.json"),
              expect.objectContaining({
                devDependencies: {
                  lerna: instance.lernaVersion,
                },
              })
            );

            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });

      it("sets lerna.json command.init.exact to true", (done) => {
        const instance = new InitCommand([], {
          exact: true,
        }, testDir);

        instance.runCommand((err, code) => {
          if (err) return done.fail(err);

          try {
            expect(code).toBe(0);

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

            done();
          } catch (ex) {
            done.fail(ex);
          }
        });
      });
    });
  });

  describe("in a subdirectory of a git repo", () => {
    let testDir;

    beforeEach(() => initEmptyDir().then((dir) => {
      testDir = path.join(dir, "subdir");

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    }));

    it("creates lerna files", (done) => {
      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(GitUtilities.init).not.toBeCalled();

          expect(writeJsonFile.sync).lastCalledWith(
            path.join(testDir, "lerna.json"),
            {
              lerna: instance.lernaVersion,
              packages: ["packages/*"],
              version: "0.0.0",
            },
            { indent: 2 }
          );

          expect(writePkg.sync).lastCalledWith(
            path.join(testDir, "package.json"),
            expect.objectContaining({
              devDependencies: {
                lerna: `^${instance.lernaVersion}`,
              },
            })
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when package.json exists", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/has-package").then((dir) => {
      testDir = dir;
    }));

    it("adds lerna to sorted devDependencies", (done) => {
      readPkg.sync = jest.fn(() => ({
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      }));

      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writePkg.sync).lastCalledWith(
            path.join(testDir, "package.json"),
            expect.objectContaining({
              devDependencies: {
                alpha: "first",
                lerna: `^${instance.lernaVersion}`,
                omega: "last",
              },
            })
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates existing lerna in devDependencies", (done) => {
      readPkg.sync = jest.fn(() => ({
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      }));

      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writePkg.sync).lastCalledWith(
            path.join(testDir, "package.json"),
            expect.objectContaining({
              dependencies: {
                alpha: "first",
                omega: "last",
              },
              devDependencies: {
                lerna: `^${instance.lernaVersion}`,
              },
            })
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates existing lerna in sorted dependencies", (done) => {
      readPkg.sync = jest.fn(() => ({
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      }));

      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writePkg.sync).lastCalledWith(
            path.join(testDir, "package.json"),
            expect.objectContaining({
              dependencies: {
                alpha: "first",
                lerna: `^${instance.lernaVersion}`,
                omega: "last",
              },
            })
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when lerna.json exists", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/has-lerna").then((dir) => {
      testDir = dir;

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    }));

    it("updates lerna property to current version", (done) => {
      loadJsonFile.sync = jest.fn(() => ({
        lerna: "0.1.100",
        version: "1.2.3",
      }));

      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writeJsonFile.sync).lastCalledWith(
            expect.stringContaining("lerna.json"),
            expect.objectContaining({
              lerna: instance.lernaVersion,
            }),
            { indent: 2 }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("updates lerna property to current version in independent mode", (done) => {
      loadJsonFile.sync = jest.fn(() => ({
        lerna: "0.1.100",
        version: "independent",
      }));

      const instance = new InitCommand([], {
        independent: true,
      }, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writeJsonFile.sync).lastCalledWith(
            expect.stringContaining("lerna.json"),
            expect.objectContaining({
              lerna: instance.lernaVersion,
              version: "independent",
            }),
            { indent: 2 }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when VERSION exists", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/has-version").then((dir) => {
      testDir = dir;

      FileSystemUtilities.existsSync = jest.fn(() => true);
      FileSystemUtilities.readFileSync = jest.fn(() => "1.2.3");
    }));

    it("removes file", (done) => {
      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(FileSystemUtilities.unlinkSync).lastCalledWith(path.join(testDir, "VERSION"));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });

    it("uses value for lerna.json version property", (done) => {
      const instance = new InitCommand([], {}, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

          expect(writeJsonFile.sync).lastCalledWith(
            expect.stringContaining("lerna.json"),
            expect.objectContaining({
              version: "1.2.3",
            }),
            { indent: 2 }
          );

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });

  describe("when re-initializing with --exact", () => {
    let testDir;

    beforeEach(() => initFixture("InitCommand/updates").then((dir) => {
      testDir = dir;

      findUp.sync = jest.fn(() => path.join(testDir, "lerna.json"));
    }));

    it("sets lerna.json commands.init.exact to true", (done) => {
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
          lerna: instance.lernaVersion,
        },
      }));

      const instance = new InitCommand([], {
        exact: true,
      }, testDir);

      instance.runCommand((err, code) => {
        if (err) return done.fail(err);

        try {
          expect(code).toBe(0);

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

          done();
        } catch (ex) {
          done.fail(ex);
        }
      });
    });
  });
});
