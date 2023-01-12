import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import execa from "execa";
import path from "path";

// local modules _must_ be explicitly mocked
jest.mock("../src/lib/git-push");
jest.mock("../src/lib/is-anything-committed");
jest.mock("../src/lib/is-behind-upstream");
jest.mock("../src/lib/remote-branch-exists");

// helpers
const initFixture = initFixtureFactory(path.resolve(__dirname, "../../publish/__tests__"));

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaVersion = commandRunner(require("../src/command"));

// stabilize commit SHA
// eslint-disable-next-line @typescript-eslint/no-var-requires
expect.addSnapshotSerializer(require("@lerna/test-helpers/src/lib/serializers/serialize-git-sha"));

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
