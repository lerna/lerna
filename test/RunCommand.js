import assert from "assert";
import path from "path";

import initFixture from "./_initFixture";
import RunCommand from "../src/commands/RunCommand";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import stub from "./_stub";

describe("RunCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("RunCommand/basic", done);
  });

  it("should run a command", done => {
    const runCommand = new RunCommand(["my-script"], {});

    runCommand.runPreparations();

    let calls = 0;
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      assert.equal(command, "npm run my-script ")

      if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1") });
      if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-3") });
      if (calls >= 1) done();

      calls++;
      callback();
    });

    runCommand.runCommand();
  });
});
