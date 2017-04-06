import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import ScriptCommand from "../src/commands/ScriptCommand";
import stub from "./_stub";

describe("ScriptCommand", () => {

  describe("in a basic repo", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("ScriptCommand/basic", done);
    });

    it("should complain if invoked without command", (done) => {
      const scriptCommand = new ScriptCommand([], {});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      scriptCommand.runCommand(exitWithCode(1, (err) => {
        assert.ok(err instanceof Error);
        done();
      }));
    });

    it("should filter packages with `ignore`", (done) => {
      const scriptCommand = new ScriptCommand(["ls"], { ignore: "package-1" });

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      scriptCommand.initialize(function(error) {
        assert.equal(error, null);
      });

      assert.equal(scriptCommand.filteredPackages.length, 1);
      assert.equal(scriptCommand.filteredPackages[0].name, "package-2");

      done();
    });

    it("should run a command", (done) => {
      const scriptCommand = new ScriptCommand(["build"], {});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        assert.equal(command, "babel");

        if (calls === 0) assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/package-1"),
          env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: "package-1" }) });
        if (calls === 1) assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/package-2"),
          env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: "package-2" }) });

        calls++;
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls, 2);
        done();
      }));
    });

    it("should run a command with lifecycle pre/post", (done) => {
      const scriptCommand = new ScriptCommand(["lifecycle"], {});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      let calls = [];
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        calls.push({ command, options });
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls.length, 6);
        calls.sort((a, b) => {
          const aPackage = a.options.env.LERNA_SCRIPT_NESTED_PACKAGE;
          const bPackage = b.options.env.LERNA_SCRIPT_NESTED_PACKAGE;
          return aPackage > bPackage;
        });
        const packages = ["package-1", "package-2"];
        const commands = ["echo pre", "echo main", "echo post"];
        for (let i = 0; i < packages.length; i += 1) {
          for (let j = 0; j < commands.length; j += 1) {
            assert.deepEqual(calls.shift(), {
              command: commands[j],
              options: {
                cwd: path.join(testDir, `packages/${packages[i]}`),
                env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: packages[i] }) 
              }
            });
          }
        }
        done();
      }));
    });

    it("should run a command with parameters", (done) => {
      const scriptCommand = new ScriptCommand(["build", "--out-dir", "lib"], {});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        assert.equal(command, "babel --out-dir lib");

        if (calls === 0) assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/package-1"),
          env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: "package-1" }) });
        if (calls === 1) assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/package-2"),
          env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: "package-2" }) });

        calls++;
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls, 2);
        done();
      }));
    });
    
    it("should run with streaming enabled with --stream", (done) => {
      const scriptCommand = new ScriptCommand(["build", "--watch"], {stream: true});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "execStreaming", (command, options, prefix, callback) => {
        const pkg = "package-" + ([1,2][calls]);

        assert.equal(command, "babel --watch");
        assert.deepEqual(options, {
          cwd: path.join(testDir, "packages/" + pkg),
          env: Object.assign({}, process.env, { LERNA_SCRIPT_NESTED_PACKAGE: pkg }),
        });
        assert.equal(prefix, pkg + ": ");

        calls++;
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, done));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "should run a command for a given scope", flag: "scope", flagValue: "package-1"},
      { test: "should not run a command for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4)"},
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const scriptCommand = new ScriptCommand(["build"], {[filter.flag]: filter.flagValue});

        scriptCommand.runValidations();
        scriptCommand.runPreparations();

        const ranInPackages = [];
        stub(ChildProcessUtilities, "exec", (command, options, callback) => {
          ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
          callback();
        });

        scriptCommand.runCommand(exitWithCode(0, () => {
          assert.deepEqual(ranInPackages, ["package-1"]);
          done();
        }));
      });
    });

    it("should run a command in the package who executed the nested script", (done) => {
      process.env.LERNA_SCRIPT_NESTED_PACKAGE = "package-2";

      const scriptCommand = new ScriptCommand(["build"], {});

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      let calls = 0;
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        assert.equal(command, "babel");
        assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-2"), env: process.env });

        calls++;
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, () => {
        assert.equal(calls, 1);
        delete process.env.LERNA_SCRIPT_NESTED_PACKAGE;
        done();
      }));
    });

  });

  
  describe("with --include-filtered-dependencies", () => {
    let testDir;
    beforeEach((done) => {
      testDir = initFixture("ScriptCommand/include-filtered-dependencies", done);
    });

    it("should run a command for the given scope, including filtered deps", (done) => {
      const scriptCommand = new ScriptCommand(["build"], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      });

      scriptCommand.runValidations();
      scriptCommand.runPreparations();

      const ranInPackages = [];
      stub(ChildProcessUtilities, "exec", (command, options, callback) => {
        ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
        callback();
      });

      scriptCommand.runCommand(exitWithCode(0, () => {
        const expected = ["package-1", "package-2"];
        assert.deepEqual(ranInPackages.sort(), expected.sort());
        done();
      }));
    });
  });

});
