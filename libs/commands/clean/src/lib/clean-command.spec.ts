import { promptConfirmation as _promptConfirmation, rimrafDir as _rimrafDir } from "@lerna/core";
import { commandRunner, initFixtureFactory, normalizeRelativeDir } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaClean = commandRunner(require("../command"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const promptConfirmation = jest.mocked(_promptConfirmation);
const rimrafDir = jest.mocked(_rimrafDir);

// assertion helpers
const removedDirectories = (testDir) =>
  rimrafDir.mock.calls.map(([directory]) => normalizeRelativeDir(testDir, directory));

describe("CleanCommand", () => {
  // stub rimraf because we trust isaacs
  // .mockResolvedValue() doesn't work when you want to reject it later
  rimrafDir.mockImplementation(() => Promise.resolve());

  promptConfirmation.mockResolvedValue(true);

  describe("basic tests", () => {
    it("should rm -rf the node_modules", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)();

      expect(promptConfirmation).toHaveBeenCalled();
      expect(removedDirectories(testDir)).toEqual([
        "packages/package-1/node_modules",
        "packages/package-2/node_modules",
        "packages/package-3/node_modules",
      ]);
    });

    it("exits early when confirmation is rejected", async () => {
      const testDir = await initFixture("basic");

      promptConfirmation.mockResolvedValueOnce(false);

      await lernaClean(testDir)();

      expect(removedDirectories(testDir)).toEqual([]);
    });

    it("should be possible to skip asking for confirmation", async () => {
      const testDir = await initFixture("basic");

      await lernaClean(testDir)("--yes");

      expect(promptConfirmation).not.toHaveBeenCalled();
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
