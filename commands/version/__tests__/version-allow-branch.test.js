"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

const path = require("path");
const execa = require("execa");

// helpers
const initFixture = require("@lerna-test/helpers").initFixtureFactory(
  path.resolve(__dirname, "../../publish/__tests__")
);

// test command
const lernaVersion = require("@lerna-test/helpers").commandRunner(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/helpers/serializers/serialize-git-sha"));

describe("version --allow-branch", () => {
  const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

  describe("cli", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "unmatched");
      const command = lernaVersion(testDir)("--allow-branch", "main");

      await expect(command).rejects.toThrow("Branch 'unmatched' is restricted from versioning");
    });

    it("accepts an exactly matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "exact-match");
      const result = await lernaVersion(testDir)("--allow-branch", "exact-match");

      expect(result.updates).toHaveLength(5);
    });

    it("accepts a branch that matches by wildcard", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = await lernaVersion(testDir)("--allow-branch", "feature/*");

      expect(result.updates).toHaveLength(5);
    });

    it("accepts a branch that matches one of the items passed", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = await lernaVersion(testDir)("--allow-branch", "main", "feature/*");

      expect(result.updates).toHaveLength(5);
    });
  });

  describe("lerna.json", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "unmatched");
      const command = lernaVersion(testDir)();

      await expect(command).rejects.toThrow("Branch 'unmatched' is restricted from versioning");
    });

    it("accepts a matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "lerna");
      const result = await lernaVersion(testDir)();

      expect(result.updates).toHaveLength(1);
    });

    it("should prioritize cli over defaults", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "cli-override");
      const result = await lernaVersion(testDir)("--allow-branch", "cli-override");

      expect(result.updates).toHaveLength(1);
    });
  });
});
