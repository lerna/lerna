import chalk from "chalk";
import execa from "execa";
import path from "path";
import normalizeNewline from "normalize-newline";

// mocked or stubbed modules
import logger from "../src/logger";

// helpers
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import updateLernaConfig from "./helpers/updateLernaConfig";

// file under test
import UpdatedCommand from "../src/commands/UpdatedCommand";

// keep snapshots stable cross-platform
chalk.enabled = false;

const normalized = (spy) =>
  spy.mock.calls.map((args) => normalizeNewline(args[0]));

const gitTag = (opts) => execa.sync("git", ["tag", "v1.0.0"], opts);
const gitAdd = (opts) => execa.sync("git", ["add", "-A"], opts);
const gitCommit = (opts) => execa.sync("git", ["commit", "-m", "Commit"], opts);
const touchFile = (opts) => (filePath) =>
    execa.sync("touch", [path.join(opts.cwd, filePath)], opts);

const setupGitChanges = (testDir, filePaths) => {
  const opts = {
    cwd: testDir,
  };
  gitTag(opts);
  filePaths.forEach(touchFile(opts));
  gitAdd(opts);
  gitCommit(opts);
};

// isolates singleton logger method from other command instances
const stubLogger = (instance, logMethod) =>
  jest.spyOn(instance.logger, logMethod).mockImplementation(() => {});

describe("UpdatedCommand", () => {
  const loggerInfo = logger.info;

  afterEach(() => {
    logger.info = loggerInfo;
  });

  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("basic", () => {
    let testDir;

    beforeEach(() => initFixture("UpdatedCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should list changes", (done) => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list all packages when no tag is found", (done) => {
      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes with --force-publish *", (done) => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      setupGitChanges(testDir, [
        "packages/package-3/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2,package-4"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes without ignored files", (done) => {
      updateLernaConfig(testDir, {
        commands: { // "command" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      setupGitChanges(testDir, [
        "packages/package-2/ignored-file",
        "packages/package-3/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes for explicitly changed packages", (done) => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        [SECRET_FLAG]: true
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes in private packages", (done) => {
      setupGitChanges(testDir, [
        "packages/package-5/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("circular", () => {
    let testDir;

    beforeEach(() => initFixture("UpdatedCommand/circular").then((dir) => {
      testDir = dir;
    }));

    it("should list changes", (done) => {
      setupGitChanges(testDir, [
        "packages/package-3/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes with --force-publish *", (done) => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      setupGitChanges(testDir, [
        "packages/package-4/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list changes without ignored files", (done) => {
      updateLernaConfig(testDir, {
        command: { // "commands" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      setupGitChanges(testDir, [
        "packages/package-2/ignored-file",
        "packages/package-3/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      const logInfo = stubLogger(updatedCommand, "info");

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(normalized(logInfo)).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});

const SECRET_FLAG = new Buffer("ZGFuZ2Vyb3VzbHlPbmx5UHVibGlzaEV4cGxpY2l0VXBkYXRlc1RoaXNJc0FDdXN0b21GbGFnRm9yQmFiZWxBbmRZb3VTaG91bGROb3RCZVVzaW5nSXRKdXN0RGVhbFdpdGhNb3JlUGFja2FnZXNCZWluZ1B1Ymxpc2hlZEl0SXNOb3RBQmlnRGVhbA==", "base64").toString("ascii");
