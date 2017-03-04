import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import RunCommand from "../src/commands/RunCommand";
import logger from "../src/logger";
import stub from "./helpers/stub";
import FakeChild from "./helpers/fakeChild";

describe("RunCommand", () => {

  describe("in a basic repo", () => {
    let testDir;

    beforeEach(() => initFixture("RunCommand/basic").then((dir) => {
      testDir = dir;
    }));

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

    it("should run with streaming enabled with --stream", (done) => {
      const runCommand = new RunCommand(["my-script"], {stream: true});

      runCommand.runValidations();
      runCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "spawnStreaming", (command, args, options, prefix, callback) => {
        const pkg = "package-" + ([1,3][calls]);

        assert.equal(command, "npm");
        assert.deepEqual(args, ["run", "my-script"]);
        assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/" + pkg),
          env: process.env,
        });
        assert.equal(prefix, pkg + ": ");

        calls++;
        callback();
      });

      runCommand.runCommand(exitWithCode(0, done));
    });

    const defaultScripts = [ "test", "env" ];
    defaultScripts.forEach((defaultScript) => {
      it(`should always run ${defaultScript}`, (done) => {
        const runCommand = new RunCommand([defaultScript], {});

        runCommand.runValidations();
        runCommand.runPreparations();

        let calls = 0;
        stub(ChildProcessUtilities, "exec", (command, options, callback) => {
          calls++;

          assert.equal(command, `npm run ${defaultScript} `);

          callback();
        });

        runCommand.runCommand(exitWithCode(0, () => {
          assert.equal(4, calls);

          done();
        }));
      });
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

  describe("with --include-filtered-dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("RunCommand/include-filtered-dependencies").then((dir) => {
      testDir = dir;
    }));

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
