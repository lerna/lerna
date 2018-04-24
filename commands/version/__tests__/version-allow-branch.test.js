"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");
const execa = require("execa");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("version --allow-branch", () => {
  const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

  describe("cli", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("normal");

      try {
        await changeBranch(testDir, "unmatched");
        await lernaVersion(testDir)("--allow-branch", "master");
      } catch (err) {
        expect(err.message).toMatch("Branch 'unmatched' is restricted from versioning");
      }
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
      const result = await lernaVersion(testDir)("--allow-branch", "master", "feature/*");

      expect(result.updates).toHaveLength(5);
    });
  });

  describe("lerna.json", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      try {
        await changeBranch(testDir, "unmatched");
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.message).toMatch("Branch 'unmatched' is restricted from versioning");
      }
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
