import assert from "assert";
import child from "child_process";
import path from "path";
import fs from "fs";
import chalk from "chalk";

import UpdatedCommand from "../src/commands/UpdatedCommand";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import logger from "../src/logger";
import stub from "./helpers/stub";
import escapeArgs from "command-join";

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
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list all packages when no tag is found", (done) => {
      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "No tags found! Comparing with initial commit.");
        if (calls === 2) assert.equal(message, `- package-1\n- package-2\n- package-3\n- package-4\n- package-5 (${chalk.red("private")})`);
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish *", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, `- package-1\n- package-2\n- package-3\n- package-4\n- package-5 (${chalk.red("private")})`);
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-3/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2,package-4"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3\n- package-4");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes without ignored files", (done) => {
      const lernaJsonLocation = path.join(testDir, "lerna.json");
      const lernaJson = JSON.parse(fs.readFileSync(lernaJsonLocation));
      lernaJson.commands = {
        publish: {
          ignore: ["ignored-file"],
        },
      };
      fs.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));

      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/ignored-file")));
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-3/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-3");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes for explicitly changed packages", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        onlyExplicitUpdates: true
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-2");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes in private packages", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-5/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, `- package-5 (${chalk.red("private")})`);
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
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-3/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-3\n- package-4");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish *", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "*"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, `- package-1\n- package-2\n- package-3\n- package-4\n- package-5 (${chalk.red("private")})`);
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes with --force-publish [package,package]", (done) => {
      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-4/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {
        forcePublish: "package-2"
      });

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-2\n- package-3\n- package-4");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });

    it("should list changes without ignored files", (done) => {
      const lernaJsonLocation = path.join(testDir, "lerna.json");
      const lernaJson = JSON.parse(fs.readFileSync(lernaJsonLocation));
      lernaJson.commands = {
        publish: {
          ignore: ["ignored-file"],
        },
      };
      fs.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));

      child.execSync("git tag v1.0.0");
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-2/ignored-file")));
      child.execSync("touch " + escapeArgs(path.join(testDir, "packages/package-3/random-file")));
      child.execSync("git add -A");
      child.execSync("git commit -m 'Commit'");

      const updatedCommand = new UpdatedCommand([], {});

      updatedCommand.runValidations();
      updatedCommand.runPreparations();

      let calls = 0;
      stub(logger, "info", (message) => {
        if (calls === 0) assert.equal(message, "Checking for updated packages...");
        if (calls === 1) assert.equal(message, "Comparing with: v1.0.0");
        if (calls === 2) assert.equal(message, "- package-3\n- package-4");
        calls++;
      });

      updatedCommand.runCommand(exitWithCode(0, done));
    });
  });
});
