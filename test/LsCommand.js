import chalk from "chalk";
import log from "npmlog";
import normalizeNewline from "normalize-newline";

// mocked or stubbed modules
import output from "../src/utils/output";

// helpers
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";

// file under test
import LsCommand from "../src/commands/LsCommand";

jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

// keep snapshots stable cross-platform
chalk.enabled = false;

const consoleOutput = () =>
  output.mock.calls.map((args) => normalizeNewline(args[0]));

describe("LsCommand", () => {
  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    let testDir;

    beforeEach(() => initFixture("LsCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {}, testDir);

      lsCommand.runValidations();
      lsCommand.runPreparations();

      lsCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "lists changes for a given scope", flag: "scope", flagValue: "package-1" },
      { test: "does not list changes for ignored packages", flag: "ignore", flagValue: "package-@(2|3|4|5)" },
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const lsCommand = new LsCommand([], {
          [filter.flag]: filter.flagValue,
        }, testDir);

        lsCommand.runValidations();
        lsCommand.runPreparations();

        lsCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);
          try {
            expect(consoleOutput()).toMatchSnapshot();
            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });
  });

  describe("in a repo with packages outside of packages/", () => {
    let testDir;

    beforeEach(() => initFixture("LsCommand/extra").then((dir) => {
      testDir = dir;
    }));

    it("should list packages", (done) => {
      const lsCommand = new LsCommand([], {}, testDir);

      lsCommand.runValidations();
      lsCommand.runPreparations();

      lsCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with --include-filtered-dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("LsCommand/include-filtered-dependencies").then((dir) => {
      testDir = dir;
    }));

    it("should list packages, including filtered ones", (done) => {
      const lsCommand = new LsCommand([], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      }, testDir);

      lsCommand.runValidations();
      lsCommand.runPreparations();

      lsCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          expect(consoleOutput()).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });

  describe("with --json", () => {
    let testDir;

    beforeEach(() => initFixture("LsCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should list packages as json objects", (done) => {
      const lsCommand = new LsCommand([], {
        json: true
      }, testDir);

      lsCommand.runValidations();
      lsCommand.runPreparations();

      lsCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);
        try {
          const outputStr = consoleOutput();
          expect(outputStr).toMatchSnapshot();
          // Output should be a parseable string
          const jsonOutput = JSON.parse(outputStr);
          expect(jsonOutput).toMatchSnapshot();
          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
