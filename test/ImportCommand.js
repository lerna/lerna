import child from "child_process";
import pathExists from "path-exists";
import assert from "assert";
import path from "path";

import PromptUtilities from "../src/PromptUtilities";
import ImportCommand from "../src/commands/ImportCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import initExternalFixture from "./_initExternalFixture";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("ImportCommand", () => {

  describe("import", () => {
    let testDir, externalDir;

    beforeEach(done => {
      testDir = initFixture("ImportCommand/basic", done);
    });

    beforeEach(done => {
      externalDir = initExternalFixture("ImportCommand/external", done);
    });

    it("should import into packages with commit history", done => {
      const importCommand = new ImportCommand([externalDir], {});

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
          const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));
          assert.ok(pathExists.sync(packageJson));
          assert.equal(lastCommit, "Init external commit");
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should be possible to skip asking for confirmation", done => {

      const importCommand = new ImportCommand([externalDir], {
        yes: true
      });

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.initialize(done);
    });
  });
});
