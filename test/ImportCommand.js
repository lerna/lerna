import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import fs from "fs";
import normalize from "normalize-path";

import PromptUtilities from "../src/PromptUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import ImportCommand from "../src/commands/ImportCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import initExternalFixture from "./_initExternalFixture";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("ImportCommand", () => {

  describe("import", () => {
    let testDir, externalDir;

    beforeEach((done) => {
      testDir = initFixture("ImportCommand/basic", done);
    });

    beforeEach((done) => {
      externalDir = initExternalFixture("ImportCommand/external", done);
    });

    it("should import into packages with commit history", (done) => {
      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      assertStubbedCalls([
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to import these commits onto the current branch?"], returns: true }
        ]],
      ]);

      importCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done(err);

        try {
          const lastCommit = ChildProcessUtilities.execSync("git log --format=\"%s\"", {encoding:"utf8"}).split("\n")[0];
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

    it("should be possible to skip asking for confirmation", (done) => {

      const importCommand = new ImportCommand([externalDir], {
        yes: true
      });

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.initialize(done);
    });

    it("should fail without an argument", (done) => {
      const importCommand = new ImportCommand([], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = "Missing argument: Path to external repository";
        assert.equal((err || {}).message, expect);
        done();
      }));
    });

    it("should fail with a missing external directory", (done) => {
      const missing = externalDir + "_invalidSuffix";
      const importCommand = new ImportCommand([missing], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = `No repository found at "${missing}"`;
        assert.equal((err || {}).message, expect);
        done();
      }));
    });

    it("should fail with a missing package.json", (done) => {
      const importCommand = new ImportCommand([externalDir], {});

      const packageJson = path.join(externalDir, "package.json");

      fs.unlinkSync(packageJson);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = `Cannot find module '${packageJson}'`;
        assert.equal((err || {}).message, expect);
        done();
      }));
    });

    it("should fail with no name in package.json", (done) => {
      const importCommand = new ImportCommand([externalDir], {});

      const packageJson = path.join(externalDir, "package.json");

      fs.writeFileSync(packageJson, "{}");

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = `No package name specified in "${packageJson}"`;
        assert.equal((err || {}).message, expect);
        done();
      }));
    });

    it("should fail if target directory exists", (done) => {
      const importCommand = new ImportCommand([externalDir], {});

      const targetDir = path.relative(
        process.cwd(),
        path.join(testDir, "packages", path.basename(externalDir))
      );

      fs.mkdirSync(targetDir);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = `Target directory already exists "${normalize(targetDir)}"`;
        try {
          assert.equal((err || {}).message, expect);
          done();
        } catch (err) {
          done(err);
        }
      }));
    });

    it("should fail if repo has uncommitted changes", (done) => {
      const importCommand = new ImportCommand([externalDir], {});

      const uncommittedFile = path.join(testDir, "ucommittedFile");

      fs.writeFileSync(uncommittedFile, "");

      ChildProcessUtilities.execSync("git add " + uncommittedFile);

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        const expect = "Local repository has un-committed changes";
        assert.equal((err || {}).message, expect);
        done();
      }));
    });
  });
});
