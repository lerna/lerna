import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";
import PromptUtilities from "../src/PromptUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";

// file under test
import CleanCommand from "../src/commands/CleanCommand";

jest.mock("../src/PromptUtilities");

// silence logs
log.level = "silent";

// stub rimraf because we trust isaacs
const fsRimraf = FileSystemUtilities.rimraf;
const resetRimraf = () => {
  FileSystemUtilities.rimraf = fsRimraf;
};
const stubRimraf = () => {
  FileSystemUtilities.rimraf = jest.fn(callsBack());
};

const removedDirectories = (testDir) =>
  FileSystemUtilities.rimraf.mock.calls.map((args) =>
    normalizeRelativeDir(testDir, args[0])
  );

describe("CleanCommand", () => {
  beforeEach(() => {
    stubRimraf();
    PromptUtilities.confirm = jest.fn(callsBack(true));
  });

  afterEach(() => {
    resetRimraf();
    jest.resetAllMocks();
  });

  describe("basic tests", () => {
    let testDir;

    beforeEach(() => initFixture("CleanCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("should rm -rf the node_modules", (done) => {
      const cleanCommand = new CleanCommand([], {}, testDir);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      cleanCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(PromptUtilities.confirm).toBeCalled();

          expect(removedDirectories(testDir)).toEqual([
            "packages/package-1/node_modules",
            "packages/package-2/node_modules",
            "packages/package-3/node_modules",
          ]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("exits early when confirmation is rejected", (done) => {
      PromptUtilities.confirm = jest.fn(callsBack(false));

      const cleanCommand = new CleanCommand([], {}, testDir);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      cleanCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(removedDirectories(testDir)).toEqual([]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("should be possible to skip asking for confirmation", (done) => {
      const cleanCommand = new CleanCommand([], {
        yes: true
      }, testDir);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      cleanCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(PromptUtilities.confirm).not.toBeCalled();

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "should only clean scoped packages",
        flag: "scope", flagValue: "package-1",
      },
      { test: "should not clean ignored packages",
        flag: "ignore", flagValue: ["package-2", "@test/package-3"],
      },
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const cleanCommand = new CleanCommand([], {
          [filter.flag]: filter.flagValue
        }, testDir);

        cleanCommand.runValidations();
        cleanCommand.runPreparations();

        cleanCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(removedDirectories(testDir)).toEqual([
              "packages/package-1/node_modules",
            ]);

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });
  });

  describe("--include-filtered-dependencies", () => {
    let testDir;

    beforeEach(() => initFixture("CleanCommand/include-filtered-dependencies").then((dir) => {
      testDir = dir;
    }));

    it("should not remove node_modules from unaffiliated packages", (done) => {
      const cleanCommand = new CleanCommand([], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      }, testDir);

      cleanCommand.runValidations();
      cleanCommand.runPreparations();

      cleanCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(removedDirectories(testDir)).toEqual([
            "packages/package-2/node_modules",
            "packages/package-1/node_modules",
          ]);

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

  });
});
