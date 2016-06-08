import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import CleanCommand from "../src/commands/CleanCommand";
import PromptUtilities from "../src/PromptUtilities";
import stub from "./_stub";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("CleanCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("CleanCommand/basic", done);
  });

  it("should rm -rf the node_modules", done => {
    const cleanCommand = new CleanCommand([], {});

    assertStubbedCalls([
      [PromptUtilities, "confirm", { valueCallback: true }, [
        { args: ["Proceed?"], returns: true }
      ]],
    ]);

    cleanCommand.runValidations();
    cleanCommand.runPreparations();

    let curPkg = 1;
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      const rmDir = path.join(testDir, "packages/package-" + curPkg, "node_modules");

      assert.equal(command, "rm -rf " + rmDir)

      curPkg++;
      callback();
    });

    cleanCommand.runCommand(exitWithCode(0, done));
  });
});
