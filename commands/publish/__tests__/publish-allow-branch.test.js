"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const execa = require("execa");

// mocked modules
const npmPublish = require("@lerna/npm-publish");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("publish --allow-branch", () => {
  const changeBranch = (cwd, name) => execa("git", ["checkout", "-B", name], { cwd });

  describe("cli", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("normal");

      try {
        await changeBranch(testDir, "unmatched");
        await lernaPublish(testDir)("--allow-branch", "master");
      } catch (err) {
        expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
      }
    });

    it("accepts an exactly matching branch", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "exact-match");
      await lernaPublish(testDir)("--allow-branch", "exact-match");

      expect(Array.from(npmPublish.registry.keys())).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
      ]);
    });

    it("accepts a branch that matches by wildcard", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      await lernaPublish(testDir)("--allow-branch", "feature/*");

      expect(npmPublish.registry.size).toBe(4);
    });

    it("accepts a branch that matches one of the items passed", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      await lernaPublish(testDir)("--allow-branch", "master", "feature/*");

      expect(npmPublish.registry.size).toBe(4);
    });
  });

  describe("lerna.json", () => {
    it("rejects a non matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      try {
        await changeBranch(testDir, "unmatched");
        await lernaPublish(testDir)();
      } catch (err) {
        expect(err.message).toMatch("Branch 'unmatched' is restricted from publishing");
      }
    });

    it("accepts a matching branch", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "lerna");
      await lernaPublish(testDir)();

      expect(npmPublish.registry.size).toBe(1);
    });

    it("should prioritize cli over defaults", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "cli-override");
      await lernaPublish(testDir)("--allow-branch", "cli-override");

      expect(npmPublish.registry.size).toBe(1);
    });
  });

  describe("--canary", () => {
    it("does not restrict publishing canary versions", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "other");
      await lernaPublish(testDir)("--allow-branch", "master", "--canary");

      expect(Array.from(npmPublish.registry.keys())).toEqual([
        "package-1",
        "package-3",
        "package-4",
        "package-2",
      ]);
    });
  });
});
