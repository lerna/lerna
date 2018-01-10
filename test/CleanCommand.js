import log from "npmlog";

// mocked or stubbed modules
import FileSystemUtilities from "../src/FileSystemUtilities";
import PromptUtilities from "../src/PromptUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/CleanCommand";

const run = yargsRunner(commandModule);

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

const removedDirectories = testDir =>
  FileSystemUtilities.rimraf.mock.calls.map(args => normalizeRelativeDir(testDir, args[0]));

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
    let lernaClean;

    beforeEach(async () => {
      testDir = await initFixture("CleanCommand/basic");
      lernaClean = run(testDir);
    });

    it("should rm -rf the node_modules", async () => {
      await lernaClean();

      expect(PromptUtilities.confirm).toBeCalled();
      expect(removedDirectories(testDir)).toEqual([
        "packages/package-1/node_modules",
        "packages/package-2/node_modules",
        "packages/package-3/node_modules",
      ]);
    });

    it("exits early when confirmation is rejected", async () => {
      PromptUtilities.confirm = jest.fn(callsBack(false));

      await lernaClean();

      expect(removedDirectories(testDir)).toEqual([]);
    });

    it("should be possible to skip asking for confirmation", async () => {
      await lernaClean("--yes");

      expect(PromptUtilities.confirm).not.toBeCalled();
    });

    it("should only clean scoped packages", async () => {
      await lernaClean("--scope", "package-1");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("should not clean ignored packages", async () => {
      await lernaClean("--ignore", "package-2", "--ignore", "@test/package-3");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("exits non-zero when rimraf errors egregiously", async () => {
      FileSystemUtilities.rimraf = jest.fn(callsBack(new Error("whoops")));
      expect.assertions(2);

      try {
        await lernaClean();
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toMatch("whoops");
      }
    });
  });

  describe("--include-filtered-dependencies", () => {
    it("should not remove node_modules from unaffiliated packages", async () => {
      const testDir = await initFixture("CleanCommand/include-filtered-dependencies");
      const lernaClean = run(testDir);
      await lernaClean("--scope", "@test/package-2", "--include-filtered-dependencies");
      expect(removedDirectories(testDir)).toEqual([
        "packages/package-2/node_modules",
        "packages/package-1/node_modules",
      ]);
    });
  });
});
