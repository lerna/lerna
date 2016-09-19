import assert from "assert";
import chalk from "chalk";

import exitWithCode from "./_exitWithCode";
import initFixture from "./_initFixture";
import LsCommand from "../src/commands/LsCommand";
import logger from "../src/logger";
import stub from "./_stub";

describe("LsCommand", () => {

  describe("in a basic repo", () => {
    beforeEach((done) => {
      initFixture("LsCommand/basic", done);
    });

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {});

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, `- package-1\n- package-2\n- package-3\n- package-4\n- package-5 (${chalk.red("private")})`);
      });

      lsCommand.runCommand(exitWithCode(0, done));
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    beforeEach((done) => {
      initFixture("LsCommand/extra", done);
    });

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {});

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, "- package-1\n- package-2\n- package-3");
      });

      lsCommand.runCommand(exitWithCode(0, done));
    });
  });

  // Both of these commands should result in the same outcome
  const filters = [
    { test: "should list changes for a given scope", flag: "scope", flagValue: "package-1"},
    { test: "should not list changes for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4|5)"},
  ];
  filters.forEach((filter) => {
    it(filter.test, (done) => {
      const lsCommand = new LsCommand([], {[filter.flag]: filter.flagValue});

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, "- package-1");
      });

      lsCommand.runCommand(exitWithCode(0, done));
    });
  });
});
