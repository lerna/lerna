"use strict";

// mocked or stubbed modules
const FileSystemUtilities = require("../src/FileSystemUtilities");
const PromptUtilities = require("../src/PromptUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaClean = require("./helpers/command-runner")(require("../src/commands/CleanCommand"));

jest.mock("../src/PromptUtilities");

const removedDirectories = testDir =>
  FileSystemUtilities.rimraf.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

describe("CleanCommand", () => {
  // stub rimraf because we trust isaacs
  const fsRimraf = FileSystemUtilities.rimraf;
  beforeEach(() => {
    FileSystemUtilities.rimraf = jest.fn(callsBack());
  });
  afterEach(() => {
    FileSystemUtilities.rimraf = fsRimraf;
  });

  PromptUtilities.confirm.mockImplementation(callsBack(true));

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
      const testDir = await initFixture("CleanCommand/basic");

      PromptUtilities.confirm.mockImplementationOnce(callsBack(false));

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
      expect.assertions(2);

      const testDir = await initFixture("CleanCommand/basic");

      FileSystemUtilities.rimraf.mockImplementationOnce(callsBack(new Error("whoops")));

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
