import assert from "assert";
import chalk from "chalk";

import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import LsCommand from "../src/commands/LsCommand";
import logger from "../src/logger";
import stub from "./helpers/stub";

function formatPrivate (pkg) {
  return `${pkg} ${chalk.grey("v1.0.0")} (${chalk.red("private")})`;
}

function formatPublic (pkg) {
  return `${pkg} ${chalk.grey("v1.0.0")}          `;
}

function formatOnlyPublic (pkg) {
  return `${pkg} ${chalk.grey("v1.0.0")} `;
}

describe("LsCommand", () => {
  describe("in a basic repo", () => {
    beforeEach(() => initFixture("LsCommand/basic"));

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {});

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, `${formatPublic("package-1")}\n${formatPublic("package-2")}\n${formatPublic("package-3")}\n${formatPublic("package-4")}\n${formatPrivate("package-5")}`);
      });

      lsCommand.runCommand(exitWithCode(0, done));
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
          assert.equal(message, formatOnlyPublic("package-1"));
        });

        lsCommand.runCommand(exitWithCode(0, done));
      });
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    beforeEach(() => initFixture("LsCommand/extra"));

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {});

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, `${formatOnlyPublic("package-1")}\n${formatOnlyPublic("package-2")}\n${formatOnlyPublic("package-3")}`);
      });

      lsCommand.runCommand(exitWithCode(0, done));
    });
  });

  describe("with --include-filtered-dependencies", () => {
    beforeEach(() => initFixture("LsCommand/include-filtered-dependencies"));

    it("should list packages, including filtered ones", (done) => {
      const lsCommand = new LsCommand([], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      });

      lsCommand.runValidations();
      lsCommand.runPreparations();

      stub(logger, "info", (message) => {
        assert.equal(message, `${formatOnlyPublic("@test/package-2")}\n${formatOnlyPublic("@test/package-1")}`);
      });

      lsCommand.runCommand(exitWithCode(0, done));
    });
  });
});
