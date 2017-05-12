import log from "npmlog";
import path from "path";

// mocked modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import UpdatedPackagesCollector from "../src/UpdatedPackagesCollector";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";

// file under test
import ExecCommand from "../src/commands/ExecCommand";

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/UpdatedPackagesCollector");

// silence logs
log.level = "silent";

const calledWithArgs = () =>
  ChildProcessUtilities.spawn.mock.calls[0][1];

const calledInPackages = () =>
  ChildProcessUtilities.spawn.mock.calls.map((args) => path.basename(args[2].cwd));

describe("ExecCommand", () => {
  beforeEach(() => {
    ChildProcessUtilities.spawn = jest.fn(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    let testDir;

    beforeAll(() => initFixture("ExecCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should complain if invoked without command", (done) => {
      const execCommand = new ExecCommand([], {}, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(1, (err) => {
        try {
          expect(err.message).toBe("You must specify which command to run.");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("passes execution error to callback", (done) => {
      const err = new Error("execa error");
      err.code = 1;
      err.cmd = "boom";

      let errorLog;
      log.once("log.error", (m) => {
        errorLog = m;
      });

      ChildProcessUtilities.spawn = jest.fn(callsBack(err));

      const execCommand = new ExecCommand(["boom"], {}, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(1, () => {
        try {
          expect(errorLog).toHaveProperty("message", "Errored while executing 'boom' in 'package-1'");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should ignore execution errors with --bail=false", (done) => {
      const execCommand = new ExecCommand(["boom"], {
        bail: false,
      }, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(0, () => {

        try {
          expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
          expect(ChildProcessUtilities.spawn).lastCalledWith("boom", [], expect.objectContaining({
            reject: false,
          }), expect.any(Function));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should filter packages with `ignore`", (done) => {
      const execCommand = new ExecCommand(["ls"], {
        ignore: "package-1",
      }, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
          expect(ChildProcessUtilities.spawn).lastCalledWith("ls", [], {
            cwd: path.join(testDir, "packages/package-2"),
            env: expect.objectContaining({
              LERNA_PACKAGE_NAME: "package-2",
            }),
            shell: true,
          }, expect.any(Function));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should filter packages that are not updated with --since", (done) => {
      UpdatedPackagesCollector.prototype.getUpdates = jest.fn(() => [{
        package: {
          name: "package-2",
          location: path.join(testDir, "packages/package-2"),
        },
      }]);

      const execCommand = new ExecCommand(["ls"], {
        since: "",
      }, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
          expect(ChildProcessUtilities.spawn).lastCalledWith("ls", [], {
            cwd: path.join(testDir, "packages/package-2"),
            env: expect.objectContaining({
              LERNA_PACKAGE_NAME: "package-2",
            }),
            shell: true,
          }, expect.any(Function));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should run a command", (done) => {
      const execCommand = new ExecCommand(["ls"], {}, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
          expect(calledInPackages()).toEqual([
            "package-1",
            "package-2",
          ]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should run a command with parameters", (done) => {
      const execCommand = new ExecCommand(["ls", "-la"], {}, testDir);

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
          expect(calledWithArgs()).toEqual(["-la"]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "runs a command for a given scope", flag: "scope", flagValue: "package-1" },
      { test: "does not run a command for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4)" },
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const execCommand = new ExecCommand(["ls"], {
          [filter.flag]: filter.flagValue,
        }, testDir);

        execCommand.runValidations();
        execCommand.runPreparations();

        execCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(calledInPackages()).toEqual(["package-1"]);

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });
  });
});
