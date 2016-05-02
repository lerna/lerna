import assert from "assert";
import path from "path";
import child from "child_process";

import UpdatedCommand from "../src/commands/UpdatedCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import logger from "../src/logger";
import stub from "./_stub";

describe("UpdatedCommand", () => {
  let testDir;

  beforeEach(done => {
    testDir = initFixture("UpdatedCommand/basic", done);
  });

  it("should list changes", done => {
    const updatedCommand = new UpdatedCommand([], {});

    child.execSync("git tag v1.0.0");
    child.execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
    child.execSync("git add -A");
    child.execSync("git commit -m 'Commit'");

    updatedCommand.runValidations();
    updatedCommand.runPreparations();

    let calls = 0;
    stub(logger, "info", message => {
      if (calls === 0) assert.equal(message, "Checking for updated packages...");
      if (calls === 1) assert.equal(message, "");
      if (calls === 2) assert.equal(message, "- package-2\n- package-3");
      if (calls === 3) assert.equal(message, "");
      calls++;
    });

    updatedCommand.runCommand(exitWithCode(0, done));
  });

  it("should list changes with --force-version *", done => {
    const updatedCommand = new UpdatedCommand([], {
      forceVersion: "*"
    });

    child.execSync("git tag v1.0.0");
    child.execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
    child.execSync("git add -A");
    child.execSync("git commit -m 'Commit'");

    updatedCommand.runValidations();
    updatedCommand.runPreparations();

    let calls = 0;
    stub(logger, "info", message => {
      if (calls === 0) assert.equal(message, "Checking for updated packages...");
      if (calls === 1) assert.equal(message, "");
      if (calls === 2) assert.equal(message, "- package-1\n- package-2\n- package-3\n- package-4");
      if (calls === 3) assert.equal(message, "");
      calls++;
    });

    updatedCommand.runCommand(exitWithCode(0, done));
  });

  it("should list changes with --force-version [package,package]", done => {
    const updatedCommand = new UpdatedCommand([], {
      forceVersion: "package-2,package-4"
    });

    child.execSync("git tag v1.0.0");
    child.execSync("touch " + path.join(testDir, "packages/package-3/random-file"));
    child.execSync("git add -A");
    child.execSync("git commit -m 'Commit'");

    updatedCommand.runValidations();
    updatedCommand.runPreparations();

    let calls = 0;
    stub(logger, "info", message => {
      if (calls === 0) assert.equal(message, "Checking for updated packages...");
      if (calls === 1) assert.equal(message, "");
      if (calls === 2) assert.equal(message, "- package-2\n- package-3\n- package-4");
      if (calls === 3) assert.equal(message, "");
      calls++;
    });

    updatedCommand.runCommand(exitWithCode(0, done));
  });
});
