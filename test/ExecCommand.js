import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import ExecCommand from "../src/commands/ExecCommand";
import stub from "./_stub";

describe("ExecCommand", () => {
  let testDir;
  beforeEach(done => {
    testDir = initFixture("ExecCommand/basic", done);
  });

  it("should complain if invoked without command", done => {
    const execCommand = new ExecCommand([], {});

    execCommand.runValidations();
    execCommand.runPreparations();

    execCommand.runCommand(exitWithCode(1, (err) => {
      assert.ok(err instanceof Error);
      done();
    }));
  });

  it("should run a command", done => {
    const execCommand = new ExecCommand(["ls"], {});

    execCommand.runValidations();
    execCommand.runPreparations();

    let calls = 0;
    stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
      assert.equal(command, "ls");

      if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1") });
      if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-2") });

      calls++;
      callback();
    });

    execCommand.runCommand(exitWithCode(0, () => {
      assert.equal(calls, 2);
      done();
    }));
  });

  it("should run a command with parameters", done => {
    const execCommand = new ExecCommand(["ls", "-la"], {});

    execCommand.runValidations();
    execCommand.runPreparations();

    let calls = 0;
    stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
      assert.equal(command, "ls");

      if (calls === 0) {
        assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1") });
        assert.deepEqual(args, ["-la"]);
      }
      if (calls === 1) {
        assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-2") });
        assert.deepEqual(args, ["-la"]);
      }

      calls++;
      callback();
    });

    execCommand.runCommand(exitWithCode(0, () => {
      assert.equal(calls, 2);
      done();
    }));
  });
});
