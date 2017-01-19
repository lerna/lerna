import assert from "assert";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import ExportCommand from "../src/commands/ExportCommand";
import FileSystemUtilities from "../src/FileSystemUtilities";
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import userHome from "user-home";
import logger from "../src/logger";
import stub from "./_stub";
import path from "path";
import assertStubbedCalls from "./_assertStubbedCalls";

describe("ExportCommand", () => {

  let testDir;
  describe("in a basic repo", () => {
    beforeEach((done) => {
      testDir = initFixture("ExportCommand/basic", done);
    });

    it("should export all packages", (done) => {
      const exportCommand = new ExportCommand([], {"dry-run": true});

      exportCommand.runValidations();
      exportCommand.runPreparations();

      stub(ChildProcessUtilities, "execSync", () => {});
      stub(FileSystemUtilities, "mkdirSync", () => {});

      assertStubbedCalls([]
        .concat(getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to: userHome, pkg: "package-1" }))
        .concat(getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to: userHome, pkg: "package-2" }))
        .concat(getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to: userHome, pkg: "package-3" }))
        .concat(getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to: userHome, pkg: "package-4" }))
      );


      exportCommand.runCommand(exitWithCode(0, done));
    });

    it("should export a single package", (done) => {
      const to = "/path/to/the/mls/cup";
      const pkg = "package-2";
      const exportCommand = new ExportCommand([pkg, to], {"dry-run": true});

      exportCommand.runValidations();
      exportCommand.runPreparations();

      stub(ChildProcessUtilities, "execSync", () => {});
      stub(FileSystemUtilities, "mkdirSync", () => {});

      assertStubbedCalls(getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to, pkg }));

      exportCommand.runCommand(exitWithCode(0, done));
    });

    describe("while doing a dry run", () => {
      it("should export a single package", (done) => {
        const pkg = "package-1";
        const exportCommand = new ExportCommand([pkg], {dryRun: true});

        exportCommand.runValidations();
        exportCommand.runPreparations();

        let index = 0;
        const patterns = [
          "The following directories would be moved",
          pkg
        ];
        stub(logger, "info", (message) => {
          assert.ok(message.includes(patterns[index]));
          index++;
        });

        exportCommand.runCommand(exitWithCode(0, done));
      });

      it("should export all packages", (done) => {
        const exportCommand = new ExportCommand([], {dryRun: true});

        exportCommand.runValidations();
        exportCommand.runPreparations();

        let index = 0;
        const patterns = [
          "The following directories would be moved",
          "package-1",
          "package-2",
          "package-3",
          "package-4"
        ];
        stub(logger, "info", (message) => {
          assert.ok(message.includes(patterns[index]));
          index++;
        });

        exportCommand.runCommand(exitWithCode(0, done));
      });

      it("should allow you to specify a target directory", (done) => {
        const to = "/path/to/the/mls/cup";
        const pkg = "package-2";
        const exportCommand = new ExportCommand([pkg, to], {dryRun: true});

        exportCommand.runValidations();
        exportCommand.runPreparations();

        let index = 0;
        const patterns = [
          "The following directories would be moved",
          pkg
        ];
        stub(logger, "info", (message) => {
          assert.ok(message.includes(patterns[index]));
          index++;
        });

        exportCommand.runCommand(exitWithCode(0, done));
      });
    });
  });
});

function getStubbedAssertions({ FileSystemUtilities, ChildProcessUtilities, testDir, to, pkg }) {
  return [
    [ChildProcessUtilities, "execSync", { nodeCallback: true }, [
      { args: [`git subtree split -P ${testDir}/packages/${pkg} -b export-${pkg}`] }
    ]],
    [FileSystemUtilities, "mkdirSync", { nodeCallback: true }, [
      { filePath: path.join(to, pkg) }
    ]],
    [ChildProcessUtilities, "execSync", { nodeCallback: true }, [
      { args: ["git init"] }
    ]],
    [ChildProcessUtilities, "execSync", { nodeCallback: true }, [
      { args: [`git pull ${testDir} export-${pkg}`] }
    ]],
    [ChildProcessUtilities, "execSync", { nodeCallback: true }, [
      { args: [`git rm -r ${testDir}/packages/${pkg}`] }
    ]],
  ];
}
