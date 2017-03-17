import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import ExecCommand from "../src/commands/ExecCommand";
import stub from "./helpers/stub";

describe("ExecCommand", () => {

  describe("in a basic repo", () => {
    let testDir;

    beforeEach(() => initFixture("ExecCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should complain if invoked without command", (done) => {
      const execCommand = new ExecCommand([], {});

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.runCommand(exitWithCode(1, (err) => {
        assert.ok(err instanceof Error);
        done();
      }));
    });

    it("should filter packages with `ignore`", (done) => {
      const execCommand = new ExecCommand(["ls"], { ignore: "package-1" });

      execCommand.runValidations();
      execCommand.runPreparations();

      execCommand.initialize(function(error) {
        assert.equal(error, null);
      });

      assert.equal(execCommand.filteredPackages.length, 1);
      assert.equal(execCommand.filteredPackages[0].name, "package-2");

      done();
    });

    it("should run a command", (done) => {
      const execCommand = new ExecCommand(["ls"], {});

      execCommand.runValidations();
      execCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        assert.equal(command, "ls");

        if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1"), env: Object.assign({}, process.env, { LERNA_PACKAGE_NAME: "package-1" }) });
        if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-2"), env: Object.assign({}, process.env, { LERNA_PACKAGE_NAME: "package-2" }) });

        calls++;
        callback();
      });

      execCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls, 2);
        done();
      }));
    });

    it("should run a command with parameters", (done) => {
      const execCommand = new ExecCommand(["ls", "-la"], {});

      execCommand.runValidations();
      execCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
        assert.equal(command, "ls");

        if (calls === 0) {
          assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1"), env: Object.assign({}, process.env, { LERNA_PACKAGE_NAME: "package-1" }) });
          assert.deepEqual(args, ["-la"]);
        }
        if (calls === 1) {
          assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-2"), env: Object.assign({}, process.env, { LERNA_PACKAGE_NAME: "package-2" }) });
          assert.deepEqual(args, ["-la"]);
        }

        calls++;
        callback();
      });

      execCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls, 2);
        done();
      }));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "should run a command for a given scope", flag: "scope", flagValue: "package-1"},
      { test: "should not run a command for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4)"},
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const execCommand = new ExecCommand(["ls"], {[filter.flag]: filter.flagValue});

        execCommand.runValidations();
        execCommand.runPreparations();

        const ranInPackages = [];
        stub(ChildProcessUtilities, "spawn", (command, args, options, callback) => {
          ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
          callback();
        });

        execCommand.runCommand(exitWithCode(0, () => {
          assert.deepEqual(ranInPackages, ["package-1"]);
          done();
        }));
      });
    });

  });

});
