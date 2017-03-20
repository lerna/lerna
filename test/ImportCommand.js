import fs from "graceful-fs";
import pathExists from "path-exists";
import assert from "assert";
import path from "path";
import escapeArgs from "command-join";
import mkdirp from "mkdirp";

import PromptUtilities from "../src/PromptUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import ImportCommand from "../src/commands/ImportCommand";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import initExternalFixture from "./helpers/initExternalFixture";
import assertStubbedCalls from "./helpers/assertStubbedCalls";

describe("ImportCommand", () => {
  describe("import", () => {
    let testDir;
    let externalDir;

    beforeEach(() =>
      Promise.resolve()
        .then(() => initExternalFixture("ImportCommand/external"))
        .then((dir) => {
          externalDir = dir;
        })
        .then(() => initFixture("ImportCommand/basic"))
        .then((dir) => {
          testDir = dir;
        })
    );

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
        if (err) return done.fail(err);

        try {
          assert.ok(!pathExists.sync(path.join(testDir, "lerna-debug.log")));

          const lastCommit = ChildProcessUtilities.execSync("git log -1 --format=\"%s\"", { cwd: testDir });
          assert.equal(lastCommit, "Init external commit");

          const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");
          assert.ok(pathExists.sync(packageJson));

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should support moved files within the external repo", (done) => {
      ChildProcessUtilities.execSync("git mv old-file new-file", { cwd: externalDir });
      ChildProcessUtilities.execSync("git commit -m \"Moved old-file to new-file\"", { cwd: externalDir });

      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      assertStubbedCalls([
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Are you sure you want to import these commits onto the current branch?"], returns: true }
        ]],
      ]);

      importCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          const lastCommit = ChildProcessUtilities.execSync("git log -1 --format=\"%s\"", { cwd: testDir });
          assert.equal(lastCommit, "Moved old-file to new-file");

          const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");
          assert.ok(pathExists.sync(newFilePath));

          done();
        } catch (ex) {
          done.fail(ex);
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
        assert.equal((err || {}).message, "Missing argument: Path to external repository");
        done();
      }));
    });

    it("should fail with a missing external directory", (done) => {
      const missing = externalDir + "_invalidSuffix";
      const importCommand = new ImportCommand([missing], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        assert.equal((err || {}).message, `No repository found at "${missing}"`);
        done();
      }));
    });

    it("should fail with a missing package.json", (done) => {
      fs.unlinkSync(path.join(externalDir, "package.json"));

      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        expect(err).toBeDefined();
        expect(err.message).toMatch("package.json");
        expect(err.code).toBe("MODULE_NOT_FOUND");
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
        assert.equal((err || {}).message, `No package name specified in "${packageJson}"`);
        done();
      }));
    });

    it("should fail if target directory exists", (done) => {
      const targetDir = path.relative(
        process.cwd(),
        path.join(testDir, "packages", path.basename(externalDir))
      );

      mkdirp.sync(targetDir);

      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        assert.equal((err || {}).message, `Target directory already exists "${targetDir}"`);
        done();
      }));
    });

    it("should infer correct target directory given packages glob", (done) => {
      const targetDir = path.relative(
        process.cwd(),
        path.join(testDir, "pkg", path.basename(externalDir))
      );

      mkdirp.sync(targetDir);

      changeLernaConfig(testDir, (lernaJson) => {
        lernaJson.packages = [ "pkg/*" ];
      });

      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        assert.equal((err || {}).message, `Target directory already exists "${targetDir}"`);
        done();
      }));
    });

    it("should fail if repo has uncommitted changes", (done) => {
      const uncommittedFile = path.join(testDir, "uncommittedFile");
      fs.writeFileSync(uncommittedFile, "stuff");
      ChildProcessUtilities.execSync(`git add ${escapeArgs(uncommittedFile)}`, { cwd: testDir });

      const importCommand = new ImportCommand([externalDir], {});

      importCommand.runValidations();
      importCommand.runPreparations();

      importCommand.runCommand(exitWithCode(1, (err) => {
        assert.equal((err || {}).message, "Local repository has un-committed changes");
        done();
      }));
    });
  });
});

// TODO: extract to test/_something, use from test/UpdatedCommand.js
function changeLernaConfig(testDir, adjustFn) {
  assert.equal(typeof testDir, "string");
  assert.equal(typeof adjustFn, "function");

  const lernaJsonLocation = path.join(testDir, "lerna.json");
  const lernaJson = JSON.parse(fs.readFileSync(lernaJsonLocation));
  adjustFn(lernaJson);
  fs.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));
}
