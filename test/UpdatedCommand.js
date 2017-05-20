import chalk from "chalk";
import execa from "execa";
import log from "npmlog";
import normalizeNewline from "normalize-newline";
import path from "path";

// mocked or stubbed modules
import output from "../src/utils/output";

// helpers
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import loggingOutput from "./helpers/loggingOutput";
import updateLernaConfig from "./helpers/updateLernaConfig";

// file under test
import UpdatedCommand from "../src/commands/UpdatedCommand";

jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

// keep snapshots stable cross-platform
chalk.enabled = false;

const consoleOutput = () =>
  output.mock.calls.map((args) => normalizeNewline(args[0]));

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

describe("UpdatedCommand", () => {
  afterEach(() => jest.resetAllMocks());

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

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should list all packages when no tag is found", (done) => {
      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
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
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
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
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
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

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
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
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
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

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(loggingOutput()).toMatchSnapshot();
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should return a non-zero exit code when there are no changes", (done) => {
      gitTag({ cwd: testDir });

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(1, done));
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

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
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
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
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
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
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

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should return a non-zero exit code when there are no changes", (done) => {
      gitTag({ cwd: testDir });

      const updatedCommand = new UpdatedCommand([], {}, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(1, done));
    });
  });

  /** =========================================================================
   * JSON Output
   * ======================================================================= */

  describe("with --json", () => {
    let testDir;

    beforeEach(() => initFixture("UpdatedCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should list changes as a json object", (done) => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      const updatedCommand = new UpdatedCommand([], {
        json: true
      }, testDir);

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      updatedCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          // Output should be a parseable string
          const jsonOutput = JSON.parse(consoleOutput());
          expect(jsonOutput).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});

// TODO: remove this when we _really_ remove support for SECRET_FLAG
const Buffer = require("safe-buffer").Buffer;
// eslint-disable-next-line max-len
const SECRET_FLAG = Buffer.from("ZGFuZ2Vyb3VzbHlPbmx5UHVibGlzaEV4cGxpY2l0VXBkYXRlc1RoaXNJc0FDdXN0b21GbGFnRm9yQmFiZWxBbmRZb3VTaG91bGROb3RCZVVzaW5nSXRKdXN0RGVhbFdpdGhNb3JlUGFja2FnZXNCZWluZ1B1Ymxpc2hlZEl0SXNOb3RBQmlnRGVhbA==", "base64").toString("ascii");
