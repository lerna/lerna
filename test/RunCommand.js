import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import RunCommand from "../src/commands/RunCommand";
import logger from "../src/logger";
import stub from "./_stub";
import FakeChild from "./_fakeChild";

describe("RunCommand", () => {

  describe("in a basic repo", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("RunCommand/basic", done);
    });

    it("should run a command", (done) => {
      const runCommand = new RunCommand(["my-script"], {});

      runCommand.runValidations();
      runCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        assert.equal(command, "npm run my-script ");

        if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1"), env: process.env });
        if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-3"), env: process.env });

        calls++;
        callback();
      });

      runCommand.runCommand(exitWithCode(0, done));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "should run a command for a given scope", flag: "scope", flagValue: "package-1"},
      { test: "should not run a command for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4)"},
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const runCommand = new RunCommand(["my-script"], {[filter.flag]: filter.flagValue});

        runCommand.runValidations();
        runCommand.runPreparations();

        const ranInPackages = [];
        stub(ChildProcessUtilities, "exec", (command, options, callback) => {
          ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
          callback();
        });

        runCommand.runCommand(exitWithCode(0, () => {
          assert.deepEqual(ranInPackages, ["package-1"]);
          done();
        }));
      });
    });

    it("should wait for children to exit", (done) => {
      const runCommand = new RunCommand(["my-script"], {});

      runCommand.runValidations();
      runCommand.runPreparations();

      const children = [];
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        children.unshift(new FakeChild);
        ChildProcessUtilities.registerChild(children[0]);
        callback();
      });

      let lastInfo;
      stub(logger, "info", (message) => lastInfo = message);

      let haveExited = false;
      runCommand.runCommand(exitWithCode(0, (err) => {
        assert.equal(lastInfo, "Waiting for 2 child processes to exit. CTRL-C to exit immediately.");
        haveExited = true;
        done(err);
      }));

      assert.equal(haveExited, false);

      children.forEach((child) => child.emit("exit"));
    });

  });

  describe.only("with --include-filtered-dependencies", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("RunCommand/include-filtered-dependencies", done);
    });

    it("should run a command for the given scope, including filtered deps", (done) => {
      const runCommand = new RunCommand(["my-script"], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      });

      runCommand.runValidations();
      runCommand.runPreparations();

      const ranInPackages = [];
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
        callback();
      });

      runCommand.runCommand(exitWithCode(0, () => {
        const expected = ["package-1", "package-2"];
        assert.deepEqual(ranInPackages.sort(), expected.sort());
        done();
      }));
    });
  });

});
