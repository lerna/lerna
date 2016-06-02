import child from "child_process";
import pathExists from "path-exists";
import assert from "assert";
import path from "path";

import PromptUtilities from "../src/PromptUtilities";
import ImportCommand from "../src/commands/ImportCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import initForeignFixture from "./_initForeignFixture";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("ImportCommand", () => {

  describe("import", () => {
    let testDir, foreignDir;

    beforeEach(done => {
      testDir = initFixture("ImportCommand/basic", done);
    });

    beforeEach(done => {
      foreignDir = initForeignFixture("ImportCommand/foreign", done);
    });

    it("should import into packages with commit history", done => {
      const importCommand = new ImportCommand([foreignDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      assertStubbedCalls([
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to import these commits onto the current branch?"], returns: true }
        ]],
      ]);

      importCommand.runCommand(exitWithCode(0, err => {
        if (err) return done(err);

        try {
          const lastCommit = child.execSync("git log --format=\"%s\"", {encoding:"utf8"}).split("\n")[0];
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.ok(pathExists.sync(path.join(testDir, "packages/foreign/package.json")));
          assert.equal(lastCommit, "Init foreign commit");
          done();
        } catch (err) {
          done(err);
        }
      }));
    });
  });
});
