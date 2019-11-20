"use strict";

jest.mock("@lerna/rimraf-dir");
jest.mock("@lerna/prompt");

const fs = require("fs-extra");
const path = require("path");

// mocked or stubbed modules
const rimrafDir = require("@lerna/rimraf-dir");
const PromptUtilities = require("@lerna/prompt");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");

// file under test
const lernaClean = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const removedDirectories = testDir =>
  rimrafDir.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

describe("CleanCommand", () => {
  // stub rimraf because we trust isaacs
  // .mockResolvedValue() doesn't work when you want to reject it later
  rimrafDir.mockImplementation(() => Promise.resolve());

  PromptUtilities.confirm.mockResolvedValue(true);

  describe("basic tests", () => {
    it("should rm -rf the node_modules", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)();

      expect(PromptUtilities.confirm).toHaveBeenCalled();
      expect(removedDirectories(testDir)).toEqual([
        "packages/package-1/node_modules",
        "packages/package-2/node_modules",
        "packages/package-3/node_modules",
      ]);
    });

    it("exits early when confirmation is rejected", async () => {
      const testDir = await initFixture("basic");

      PromptUtilities.confirm.mockResolvedValueOnce(false);

      await lernaClean(testDir)();

      expect(removedDirectories(testDir)).toEqual([]);
    });

    it("should be possible to skip asking for confirmation", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)("--yes");

      expect(PromptUtilities.confirm).not.toHaveBeenCalled();
    });

    it("should only clean scoped packages", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)("--scope", "package-1");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("should not clean ignored packages", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)("--ignore", "package-2", "--ignore", "@test/package-3");

      expect(removedDirectories(testDir)).toEqual(["packages/package-1/node_modules"]);
    });

    it("exits non-zero when rimraf errors egregiously", async () => {
      rimrafDir.mockImplementationOnce(() => Promise.reject(new Error("whoops")));

      const testDir = await initFixture("basic");
      const command = lernaClean(testDir)();

      await expect(command).rejects.toThrow("whoops");
    });

    it("requires a git repo when using --since", async () => {
      const testDir = await initFixture("basic");

      await fs.remove(path.join(testDir, ".git"));

      const command = lernaClean(testDir)("--since", "some-branch");
      await expect(command).rejects.toThrow("this is not a git repository");
    });
  });

  describe("--include-filtered-dependencies", () => {
    it("should not remove node_modules from unaffiliated packages", async () => {
      const testDir = await initFixture("include-filtered-dependencies");

      await lernaClean(testDir)("--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(removedDirectories(testDir)).toEqual([
        "packages/package-2/node_modules",
        "packages/package-1/node_modules",
      ]);
    });
  });
});
