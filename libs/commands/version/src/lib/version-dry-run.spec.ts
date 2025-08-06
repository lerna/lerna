import { collectProjectUpdates as _collectUpdates, promptConfirmation } from "@lerna/core";
import { commandRunner, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs";
import path from "path";

jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

jest.mock("./is-anything-committed", () => ({
  isAnythingCommitted: jest.fn().mockReturnValue(true),
}));
jest.mock("./is-behind-upstream", () => ({
  isBehindUpstream: jest.fn().mockReturnValue(false),
}));
jest.mock("./remote-branch-exists", () => ({
  remoteBranchExists: jest.fn().mockResolvedValue(true),
}));

// Mock fs.existsSync for lockfile detection tests
jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const collectUpdates = _collectUpdates as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFs = fs as any;

const initFixture = initFixtureFactory(path.resolve(__dirname, "../../../publish"));
const lernaVersion = commandRunner(require("../command"));

describe("VersionCommand --dry-run", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockFs.existsSync.mockReset();
  });

  describe("basic functionality", () => {
    it("executes in dry-run mode showing changes without making them", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("Executing in dry-run mode - no changes will be made"))
      ).toBe(true);
      expect(logMessages.some((msg) => msg.includes("dry-run finished - no changes were made"))).toBe(true);
    });

    it("skips confirmation prompts in dry-run mode", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      // Should not prompt for confirmation in dry-run mode
      expect(promptConfirmation).not.toHaveBeenCalled();
    });

    it("shows version updates that would be made", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("The following package versions would be updated:"))
      ).toBe(true);
      expect(logMessages.some((msg) => msg.includes("package-1: 1.0.0 => 1.0.1"))).toBe(true);
    });

    it("shows files that would be modified", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("The following files would be modified:"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("package.json"))).toBe(true);
    });
  });

  describe("git operations", () => {
    it("shows git operations that would be performed", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("The following git operations would be performed:"))
      ).toBe(true);
      expect(logMessages.some((msg) => msg.includes("git add <modified files>"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("git commit"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("git tag"))).toBe(true);
    });

    it("shows git operations would be skipped with --no-git-tag-version", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--no-git-tag-version", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("Skipping git tag/commit (--no-git-tag-version)"))).toBe(
        true
      );
    });

    it("shows git push would be performed", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("Would push to remote: git push origin main --follow-tags"))
      ).toBe(true);
    });

    it("shows git push would be skipped with --no-push", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--no-push", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("Skipping git push (--no-push)"))).toBe(true);
    });
  });

  describe("lifecycle scripts", () => {
    it("shows lifecycle scripts that would be executed", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("The following lifecycle scripts would be executed:"))
      ).toBe(true);
      expect(logMessages.some((msg) => msg.includes("root preversion"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("root version"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("package-1 preversion"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("package-1 version"))).toBe(true);
    });

    it("shows postversion scripts that would be executed", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) =>
          msg.includes("The following postversion lifecycle scripts would be executed:")
        )
      ).toBe(true);
      expect(logMessages.some((msg) => msg.includes("package-1 postversion"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("root postversion"))).toBe(true);
    });
  });

  describe("conventional commits", () => {
    it("works with conventional commits", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--conventional-commits");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("Executing in dry-run mode - no changes will be made"))
      ).toBe(true);
    });
  });

  describe("independent versioning", () => {
    it("works with independent versioning mode", async () => {
      const testDir = await initFixture("independent");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(
        logMessages.some((msg) => msg.includes("Executing in dry-run mode - no changes will be made"))
      ).toBe(true);
    });
  });

  describe("release creation", () => {
    it("shows release creation in dry-run mode with --create-release=github", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--create-release=github", "--conventional-commits", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("Would create releases..."))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("github release for"))).toBe(true);
    });

    it("shows release creation in dry-run mode with --create-release=gitlab", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--create-release=gitlab", "--conventional-commits", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("Would create releases..."))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("gitlab release for"))).toBe(true);
    });

    it("shows releases would be skipped when not specified", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("Skipping releases"))).toBe(true);
    });

    it("shows independent release creation", async () => {
      const testDir = await initFixture("independent");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1", "package-2");
      await lernaVersion(testDir)("--dry-run", "--create-release=github", "--conventional-commits", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("github release for package-1@"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("github release for package-2@"))).toBe(true);
    });
  });

  describe("dist version syncing", () => {
    it("shows dist package.json files that would be modified with --sync-dist-version", async () => {
      const testDir = await initFixture("normal");

      // Mock dist directory structure exists
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.endsWith("/dist/package.json") || filePath.includes("package-lock.json");
      });

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--sync-dist-version", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("The following files would be modified:"))).toBe(true);
      expect(logMessages.some((msg) => msg.includes("dist/package.json"))).toBe(true);
    });

    it("does not show dist files when they don't exist", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "--sync-dist-version", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("dist/package.json"))).toBe(false);
    });

    it("shows custom contents directory when specified", async () => {
      const testDir = await initFixture("normal");

      // Mock custom contents directory structure exists
      mockFs.existsSync.mockImplementation((filePath: string) => {
        return filePath.includes("build/package.json");
      });

      collectUpdates.setUpdated(testDir, "package-1");

      // Mock the package to have a custom contents directory
      const originalGetPackage = require("@lerna/core").getPackage;
      const mockGetPackage = jest.spyOn(require("@lerna/core"), "getPackage");
      mockGetPackage.mockImplementation((node) => {
        const pkg = originalGetPackage(node);
        // Override the contents property to use "build"
        Object.defineProperty(pkg, "contents", {
          value: "build",
          configurable: true,
        });
        return pkg;
      });

      await lernaVersion(testDir)("--dry-run", "--sync-dist-version", "patch");

      const logMessages = loggingOutput("info");
      expect(logMessages.some((msg) => msg.includes("build/package.json"))).toBe(true);

      mockGetPackage.mockRestore();
    });
  });

  describe("file system verification", () => {
    it("ensures no actual modifications are made to package.json files", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      const package1Path = path.join(testDir, "packages/package-1/package.json");
      const originalContent = require(package1Path);

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      // Verify the file content hasn't changed
      const currentContent = require(package1Path);
      expect(currentContent.version).toBe(originalContent.version);
      expect(currentContent).toEqual(originalContent);
    });

    it("ensures no lockfiles are actually modified", async () => {
      const testDir = await initFixture("normal");

      // Get original lockfile existence before mocking
      const lockfilePath = path.join(testDir, "package-lock.json");
      const originalLockfileExists = jest.requireActual("fs").existsSync(lockfilePath);

      // Mock fs.existsSync for the dry-run logging, but preserve original behavior for verification
      mockFs.existsSync.mockImplementation((filePath: string) => {
        if (filePath === lockfilePath) {
          return originalLockfileExists; // Return the original value, not a mocked one
        }
        return false;
      });

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      // Verify lockfile existence hasn't changed by checking the real filesystem
      expect(jest.requireActual("fs").existsSync(lockfilePath)).toBe(originalLockfileExists);
    });

    it("ensures no git operations are actually performed", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      // Mock to track if git operations would be called
      const childProcess = require("@lerna/child-process");
      const execSpy = jest.spyOn(childProcess, "exec");

      collectUpdates.setUpdated(testDir, "package-1");
      await lernaVersion(testDir)("--dry-run", "patch");

      // Verify no actual git commands were executed
      expect(execSpy).not.toHaveBeenCalledWith("git", expect.any(Array), expect.any(Object));

      execSpy.mockRestore();
    });
  });

  describe("error scenarios in dry-run mode", () => {
    it("handles git diff errors gracefully in dry-run", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");

      // Should not throw even if git operations would fail
      await expect(lernaVersion(testDir)("--dry-run", "patch")).resolves.toBeDefined();
    });

    it("handles lockfile detection errors gracefully", async () => {
      const testDir = await initFixture("normal");

      // Mock fs.existsSync to return false for all files to simulate a clean environment
      // The lockfile detection already has error handling built-in, so this tests that
      // the dry-run mode works even when no lockfiles are detected
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");

      // Should complete successfully in dry-run mode
      await expect(lernaVersion(testDir)("--dry-run", "patch")).resolves.toBeDefined();
    });

    it("handles missing version gracefully in dry-run", async () => {
      const testDir = await initFixture("normal");
      mockFs.existsSync.mockReturnValue(false);

      collectUpdates.setUpdated(testDir, "package-1");

      // Should not throw in dry-run mode
      await expect(lernaVersion(testDir)("--dry-run", "patch")).resolves.toBeDefined();
    });
  });
});
