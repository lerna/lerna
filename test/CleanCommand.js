import assert from "assert";
import path from "path";

import FileSystemUtilities from "../src/FileSystemUtilities";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import CleanCommand from "../src/commands/CleanCommand";
import PromptUtilities from "../src/PromptUtilities";
import stub from "./helpers/stub";
import assertStubbedCalls from "./helpers/assertStubbedCalls";

describe("CleanCommand", () => {
  describe("basic tests", () => {
    let testDir;

    beforeEach(() => initFixture("CleanCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should rm -rf the node_modules", (done) => {
      const cleanCommand = new CleanCommand([], {});

      assertStubbedCalls([
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Proceed?"], returns: true }
        ]],
      ]);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      let curPkg = 1;
      stub(FileSystemUtilities, "rimraf", (actualDir, callback) => {
        const expectedDir = path.join(
          testDir, "packages/package-" + curPkg, "node_modules"
        );

        assert.equal(actualDir, expectedDir);

        curPkg++;
        callback();
      });

      cleanCommand.runCommand(exitWithCode(0, done));
    });

    it("should be possible to skip asking for confirmation", (done) => {
      const cleanCommand = new CleanCommand([], {
        yes: true
      });

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      cleanCommand.initialize(done);
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "should only clean scoped packages", flag: "scope", flagValue: "package-@(1|2)" },
      { test: "should not clean ignored packages", flag: "ignore", flagValue: "package-@(3|4)" },
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const cleanCommand = new CleanCommand([], {
          [filter.flag]: filter.flagValue
        });

        assertStubbedCalls([
          [PromptUtilities, "confirm", { valueCallback: true }, [
            { args: ["Proceed?"], returns: true }
          ]],
        ]);

        cleanCommand.runValidations();
        cleanCommand.runPreparations();

        const actualDirToPackageName = (dir) => {
          const prefixLength = path.join(testDir, "packages/").length;
          const suffixLength = "/node_modules".length;
          const packageNameLength = dir.length - prefixLength - suffixLength;
          return dir.substr(prefixLength, packageNameLength);
        };
        const ranInPackages = [];
        stub(FileSystemUtilities, "rimraf", (actualDir, callback) => {
          ranInPackages.push(actualDirToPackageName(actualDir));
          callback();
        });

        cleanCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);
          assert.deepEqual(ranInPackages, ["package-1", "package-2"]);
          done();
        }));
      });
    });
  });

  describe("--include-filtered-dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("CleanCommand/include-filtered-dependencies").then((dir) => {
      testDir = dir;
    }));

    it("should not remove node_modules from unaffiliated packages", (done) => {
      const cleanCommand = new CleanCommand([], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      });

      assertStubbedCalls([
        [PromptUtilities, "confirm", { valueCallback: true }, [
          { args: ["Proceed?"], returns: true }
        ]],
      ]);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      const ranInPackages = [];
      stub(FileSystemUtilities, "rimraf", (actualDir, callback) => {
        ranInPackages.push(actualDir);
        callback();
      });

      cleanCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        const expected = ["package-1", "package-2"].map((pkg) => path.join(testDir, "packages", pkg, "node_modules"));
        assert.deepEqual(ranInPackages.sort(), expected.sort());
        done();
      }));
    });

  });
});
