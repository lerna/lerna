"use strict";

const log = require("npmlog");

// mocked or stubbed modules
const FileSystemUtilities = require("../src/FileSystemUtilities");
const PromptUtilities = require("../src/PromptUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaClean = require("./helpers/yargsRunner")(require("../src/commands/CleanCommand"));

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
    it("should rm -rf the node_modules", async () => {
      const testDir = await initFixture("CleanCommand/basic");

      await lernaClean(testDir)();

      expect(PromptUtilities.confirm).toBeCalled();
      expect(removedDirectories(testDir)).toEqual([
        "packages/package-1/node_modules",
        "packages/package-2/node_modules",
        "packages/package-3/node_modules",
      ]);
    });

    it("exits early when confirmation is rejected", async () => {
      PromptUtilities.confirm = jest.fn(callsBack(false));
      const testDir = await initFixture("CleanCommand/basic");

      await lernaClean(testDir)();

      expect(removedDirectories(testDir)).toEqual([]);
    });

    it("should be possible to skip asking for confirmation", async () => {
      const testDir = await initFixture("CleanCommand/basic");

      await lernaClean(testDir)("--yes");

      expect(PromptUtilities.confirm).not.toBeCalled();
    });

    it("should only clean scoped packages", async () => {
      const testDir = await initFixture("CleanCommand/basic");

      await lernaClean(testDir)("--scope", "package-1");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("should not clean ignored packages", async () => {
      const testDir = await initFixture("CleanCommand/basic");

      await lernaClean(testDir)("--ignore", "package-2", "--ignore", "@test/package-3");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("exits non-zero when rimraf errors egregiously", async () => {
      FileSystemUtilities.rimraf = jest.fn(callsBack(new Error("whoops")));
      expect.assertions(2);

      const testDir = await initFixture("CleanCommand/basic");

      try {
        await lernaClean(testDir)();
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toMatch("whoops");
      }
    });
  });

  describe("--include-filtered-dependencies", () => {
    it("should not remove node_modules from unaffiliated packages", async () => {
      const testDir = await initFixture("CleanCommand/include-filtered-dependencies");

      await lernaClean(testDir)("--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(removedDirectories(testDir)).toEqual([
        "packages/package-2/node_modules",
        "packages/package-1/node_modules",
      ]);
    });
  });
});
