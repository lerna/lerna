import { commandRunner, gitSHASerializer, initFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";
import path from "path";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

jest.mock("./git-push");
jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// helpers
const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(gitSHASerializer);

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
      const result = (await lernaVersion(testDir)("--allow-branch", "exact-match")) as any;

      expect(result.updates).toHaveLength(5);
    });

    it("accepts a branch that matches by wildcard", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = (await lernaVersion(testDir)("--allow-branch", "feature/*")) as any;

      expect(result.updates).toHaveLength(5);
    });

    it("accepts a branch that matches one of the items passed", async () => {
      const testDir = await initFixture("normal");

      await changeBranch(testDir, "feature/awesome");
      const result = (await lernaVersion(testDir)("--allow-branch", "main", "feature/*")) as any;

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
      const result = (await lernaVersion(testDir)()) as any;

      expect(result.updates).toHaveLength(1);
    });

    it("should prioritize cli over defaults", async () => {
      const testDir = await initFixture("allow-branch-lerna");

      await changeBranch(testDir, "cli-override");
      const result = (await lernaVersion(testDir)("--allow-branch", "cli-override")) as any;

      expect(result.updates).toHaveLength(1);
    });
  });
});
