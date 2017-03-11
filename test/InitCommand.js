import path from "path";
import fs from "fs";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import assert from "assert";

import InitCommand from "../src/commands/InitCommand";

describe("InitCommand", () => {
  let gitDir;
  let testDir;

  describe("in non git root", () => {

    beforeEach((done) => {
      gitDir = initFixture("InitCommand/git-dir", done);
    });

    it("should work in empty folder", (done) => {
      testDir = path.join(gitDir, "test-dir");
      fs.mkdirSync(testDir);
      process.chdir(testDir);
      const initCommand = new InitCommand([], {});

      initCommand.runValidations();
      initCommand.runPreparations();

      initCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);
        try {
          const expectFiles = ["lerna.json", "package.json"];
          const expectPackage = {"devDependencies": {"lerna": initCommand.lernaVersion}};
          const expectLerna = {
            "lerna": initCommand.lernaVersion,
            "packages": [
              "packages/*"
            ],
            "version": "0.0.0"
          };
          assert.equal(process.cwd(), testDir);
          assert.deepEqual(fs.readdirSync(testDir), expectFiles);
          assert.deepEqual(require(path.join(testDir, "package.json")), expectPackage);
          assert.deepEqual(require(path.join(testDir, "lerna.json")), expectLerna);
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

  });

});
