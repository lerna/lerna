import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import ExecCommand from '../src/commands/ExecCommand';
import stub from "./_stub";

describe('ExecCommand', () => {
  let testDir;
  beforeEach(done => {
    testDir = initFixture("ExecCommand/basic", done);
  });

  it("should run a command", done => {
    const execCommand = new ExecCommand(["ls"], {});

    execCommand.runValidations();
    execCommand.runPreparations();

    let calls = 0;
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      assert.equal(command, "ls");

      if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1") });
      if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-3") });

      calls++;
      callback();
    });

    execCommand.runCommand(exitWithCode(0, done));
  })
});
