import assert from "assert";
import path from "path";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import RunCommand from "../src/commands/RunCommand";
import stub from "./_stub";

describe("RunCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("RunCommand/basic", done);
  });

  it("should run a command", done => {
    const runCommand = new RunCommand(["my-script"], {});

    runCommand.runValidations();
    runCommand.runPreparations();

    let calls = 0;
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      assert.equal(command, "npm run my-script ")

      if (calls === 0) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-1") });
      if (calls === 1) assert.deepEqual(options, { cwd: path.join(testDir, "packages/package-3") });

      calls++;
      callback();
    });

    runCommand.runCommand(exitWithCode(0, done));
  });

  it("should run a command for a single package when specified via --restrict-to", done => {
    const runCommand = new RunCommand(["my-script"], {restrictTo: "package-1"});

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

  it("should run a command for packages matched by a glob when using --restrict-to", done => {
    const runCommand = new RunCommand(["my-script"], {restrictTo: "package-*"});

    runCommand.runValidations();
    runCommand.runPreparations();

    const ranInPackages = [];
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
      callback();
    });

    runCommand.runCommand(exitWithCode(0, () => {
      assert.deepEqual(ranInPackages, [
        "package-1",
        "package-3"
      ]);
      done();
    }));
  });

  it("should run for no packages when --restrict-to is given but empty", done => {
    const runCommand = new RunCommand(["my-script"], {restrictTo: ""});

    runCommand.runValidations();
    runCommand.runPreparations();

    const ranInPackages = [];
    stub(ChildProcessUtilities, "exec", (command, options, callback) => {
      ranInPackages.push(options.cwd.substr(path.join(testDir, "packages/").length));
      callback();
    });

    runCommand.runCommand(exitWithCode(0, () => {
      assert.deepEqual(ranInPackages, []);
      done();
    }));
  });
});
