import log from "npmlog";
import path from "path";

// mocked modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import GitUtilities from "../src/GitUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";

// file under test
import DiffCommand from "../src/commands/DiffCommand";

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/GitUtilities");

// silence logs
log.level = "silent";

describe("DiffCommand", () => {
  const callbackSuccess = callsBack(null, true);

  let testDir;

  beforeEach(() => initFixture("DiffCommand/basic").then((dir) => {
    testDir = dir;
    GitUtilities.hasCommit.mockImplementation(() => true);
  }));
  afterEach(() => jest.resetAllMocks());

  it("should diff everything from the first commit", (done) => {
    GitUtilities.getFirstCommit.mockImplementation(() => "beefcafe");
    ChildProcessUtilities.spawn.mockImplementation(callbackSuccess);

    const diffCommand = new DiffCommand([], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(0, (err) => {
      if (err) return done.fail(err);
      try {
        expect(ChildProcessUtilities.spawn).lastCalledWith(
          "git",
          [
            "diff",
            "beefcafe",
            "--color=auto",
          ],
          expect.objectContaining({
            cwd: testDir,
          }),
          expect.any(Function)
        );
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });

  it("should diff everything from the most recent tag", (done) => {
    GitUtilities.hasTags.mockImplementation(() => true);
    GitUtilities.getLastTaggedCommit.mockImplementation(() => "cafedead");
    ChildProcessUtilities.spawn.mockImplementation(callbackSuccess);

    const diffCommand = new DiffCommand([], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(0, (err) => {
      if (err) return done.fail(err);
      try {
        expect(ChildProcessUtilities.spawn).lastCalledWith(
          "git",
          [
            "diff",
            "cafedead",
            "--color=auto",
          ],
          expect.objectContaining({
            cwd: testDir,
          }),
          expect.any(Function)
        );
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });

  it("should diff a specific package", (done) => {
    GitUtilities.getFirstCommit.mockImplementation(() => "deadbeef");
    ChildProcessUtilities.spawn.mockImplementation(callbackSuccess);

    const diffCommand = new DiffCommand(["package-1"], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(0, (err) => {
      if (err) return done.fail(err);
      try {
        expect(ChildProcessUtilities.spawn).lastCalledWith(
          "git",
          [
            "diff",
            "deadbeef",
            "--color=auto",
            "--",
            path.join(testDir, "packages/package-1"),
          ],
          expect.objectContaining({
            cwd: testDir,
          }),
          expect.any(Function)
        );
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });

  it("should error when attempting to diff a package that doesn't exist", (done) => {
    const diffCommand = new DiffCommand(["missing"], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(1, (err) => {
      try {
        expect(err.message).toBe("Package 'missing' does not exist.");
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });

  it("should error when running in a repository without commits", (done) => {
    // override beforeEach mock
    GitUtilities.hasCommit.mockImplementation(() => false);

    const diffCommand = new DiffCommand(["package-1"], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(1, (err) => {
      try {
        expect(err.message).toBe("Can't diff. There are no commits in this repository, yet.");
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });

  it("should error when git diff exits non-zero", (done) => {
    const err = new Error("An actual non-zero, not git diff pager SIGPIPE");
    err.code = 1;
    ChildProcessUtilities.spawn.mockImplementation(callsBack(err));

    const diffCommand = new DiffCommand(["package-1"], {}, testDir);

    diffCommand.runValidations();
    diffCommand.runPreparations();

    diffCommand.runCommand(exitWithCode(1, (err) => {
      try {
        expect(err.message).toBe("An actual non-zero, not git diff pager SIGPIPE");
        done();
      } catch (ex) {
        done.fail(ex);
      }
    }));
  });
});
