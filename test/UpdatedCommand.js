import assert from "assert";
import child from "child_process";
import path from "path";
import fs from "fs";
import syncExec from "sync-exec";

import UpdatedCommand from "../src/commands/UpdatedCommand";
import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import logger from "../src/logger";
import stub from "./_stub";

const execSync = (child.execSync || syncExec);

describe("UpdatedCommand", () => {

  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("Basic", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("UpdatedCommand/basic", done);
    });

    it("should list changes", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish *", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-1\n- package-2\n- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-3/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2,package-4"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes without ignored files", (done) => {
      const lernaJsonLocation = path.join(testDir, "lerna.json");
      const lernaJson = JSON.parse(fs.readFileSync(lernaJsonLocation));
      lernaJson.publishConfig = {
        ignore: ["ignored-file"]
      };
      fs.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));

      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/ignored-file"));
      execSync("touch " + path.join(testDir, "packages/package-3/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-3");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes for explicitly changed packages", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        onlyExplicitUpdates: true
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-2");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("Circular Dependencies", () => {
    let testDir;

    beforeEach((done) => {
      testDir = initFixture("UpdatedCommand/circular", done);
    });

    it("should list changes", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-3/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish *", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-1\n- package-2\n- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-4/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes without ignored files", (done) => {
      const lernaJsonLocation = path.join(testDir, "lerna.json");
      const lernaJson = JSON.parse(fs.readFileSync(lernaJsonLocation));
      lernaJson.publishConfig = {
        ignore: ["ignored-file"]
      };
      fs.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));

      execSync("git tag v1.0.0");
      execSync("touch " + path.join(testDir, "packages/package-2/ignored-file"));
      execSync("touch " + path.join(testDir, "packages/package-3/random-file"));
      execSync("git add -A");
      execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "");
        if (calls === 2) assert.equal(message, "- package-3\n- package-4");
        if (calls === 3) assert.equal(message, "");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });
  });
});
