import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import DiffCommand from "../src/commands/DiffCommand";
import initFixture from "./_initFixture";
import stub from "./_stub";

describe("DiffCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("DiffCommand/basic", done);
  });

  it("should diff everything", done => {
    const diffCommand = new DiffCommand([], {});

    diffCommand.runPreparations();

    stub(ChildProcessUtilities, "spawn", (command, args) => {
      assert.equal(command, "git");
      assert.equal(args[0], "diff");
      assert.equal(args[1].length, 40); // commit
      assert.equal(args[2], "--color=auto");
      assert.equal(args[3], path.join(testDir, "packages"));
      done();
    });

    diffCommand.runCommand();
  });

  it("should diff a specific package", done => {
    const diffCommand = new DiffCommand(["package-1"], {});

    diffCommand.runPreparations();

    stub(ChildProcessUtilities, "spawn", (command, args) => {
      assert.equal(command, "git");
      assert.equal(args[0], "diff");
      assert.equal(args[1].length, 40); // commit
      assert.equal(args[2], "--color=auto");
      assert.equal(args[3], path.join(testDir, "packages/package-1"));
      done();
    });

    diffCommand.runCommand();
  });
});
