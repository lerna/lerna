"use strict";

const execa = require("execa");
const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const pathExists = require("path-exists");

// mocked or stubbed modules
const PromptUtilities = require("../src/PromptUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");
const updateLernaConfig = require("./helpers/updateLernaConfig");

// file under test
const lernaImport = require("./helpers/command-runner")(require("../src/commands/ImportCommand"));

jest.mock("../src/PromptUtilities");

// silence logs
log.level = "silent";

const lastCommitInDir = cwd => execa.stdout("git", ["log", "-1", "--format=%s"], { cwd });

describe("ImportCommand", () => {
  PromptUtilities.confirm.mockImplementation(callsBack(true));

  afterEach(jest.clearAllMocks);

  describe("import", () => {
    const initBasicFixtures = () =>
      Promise.all([
        initFixture("ImportCommand/basic"),
        initFixture("ImportCommand/external", "Init external commit"),
      ]);

    it("creates a module in packages location with imported commit history", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init external commit");
      expect(await pathExists(packageJson)).toBe(true);
    });

    it("imports a repo with conflicted merge commits when run with --flatten", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const cwdExternalDir = { cwd: externalDir };
      const branchName = "conflict_branch";
      const conflictedFileName = "conflicted-file.txt";
      const conflictedFile = path.join(externalDir, conflictedFileName);
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), conflictedFileName);

      await fs.writeFile(conflictedFile, "initial content");
      await execa("git", ["add", conflictedFileName], cwdExternalDir);
      await execa("git", ["commit", "-m", "Initial content written"], cwdExternalDir);
      await execa("git", ["checkout", "-b", branchName], cwdExternalDir);

      await fs.writeFile(conflictedFile, "branch content");
      await execa("git", ["commit", "-am", "branch content written"], cwdExternalDir);
      await execa("git", ["checkout", "master"], cwdExternalDir);

      await fs.writeFile(conflictedFile, "master content");
      await execa("git", ["commit", "-am", "master content written"], cwdExternalDir);

      try {
        await execa("git", ["merge", branchName], cwdExternalDir);
      } catch (e) {
        // skip
      }

      await fs.writeFile(conflictedFile, "merged content");
      await execa("git", ["add", conflictedFileName], cwdExternalDir);
      await execa("git", ["commit", "-m", "Branch merged"], cwdExternalDir);

      await lernaImport(testDir)(externalDir, "--flatten");

      expect(await lastCommitInDir(testDir)).toBe("Branch merged");
      expect(await pathExists(newFilePath)).toBe(true);
    });

    it("supports moved files within the external repo", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await execa("git", ["commit", "-m", "Moved old-file to new-file"], {
        cwd: externalDir,
      });

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Moved old-file to new-file");
      expect(await pathExists(newFilePath)).toBe(true);
    });

    it("skips empty patches with --flatten", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const cwdExternalDir = { cwd: externalDir };
      const filePath = path.join(externalDir, "file.txt");

      await fs.writeFile(filePath, "non-empty content");
      await execa("git", ["add", filePath], cwdExternalDir);
      await execa("git", ["commit", "-m", "Non-empty commit"], cwdExternalDir);

      await execa("git", ["commit", "--allow-empty", "-m", "Empty commit"], cwdExternalDir);

      const { exitCode } = await lernaImport(testDir)(externalDir, "--flatten");

      expect(await lastCommitInDir(testDir)).toBe("Non-empty commit");
      expect(exitCode).toBe(0);
    });

    it("exits early when confirmation is rejected", async () => {
      const [testDir, externalDir] = await initBasicFixtures();

      PromptUtilities.confirm.mockImplementationOnce(callsBack(false));

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init commit");
    });

    it("allows skipping confirmation prompt", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const { exitCode } = await lernaImport(testDir)(externalDir, "--yes");

      expect(exitCode).toBe(0);
      expect(PromptUtilities.confirm).not.toBeCalled();
    });

    it("errors without an argument", async () => {
      const [testDir] = await initBasicFixtures();

      try {
        await lernaImport(testDir)();
      } catch (err) {
        expect(err.message).toBe("Not enough non-option arguments: got 0, need at least 1");
      }
    });

    it("errors when external directory is missing", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const missing = `${externalDir}_invalidSuffix`;

      try {
        await lernaImport(testDir)(missing);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`No repository found at "${missing}"`);
      }
    });

    it("errors when external package.json is missing", async () => {
      const [testDir, externalDir] = await initBasicFixtures();

      await fs.unlink(path.join(externalDir, "package.json"));

      try {
        await lernaImport(testDir)(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toMatch("package.json");
        expect(err.code).toBe("MODULE_NOT_FOUND");
      }
    });

    it("errors when external package.json has no name property", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const packageJson = path.join(externalDir, "package.json");

      await fs.writeFile(packageJson, "{}");

      try {
        await lernaImport(testDir)(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`No package name specified in "${packageJson}"`);
      }
    });

    it("errors if target directory exists", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const targetDir = path.join(testDir, "packages", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      try {
        await lernaImport(testDir)(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`Target directory already exists "${relativePath}"`);
      }
    });

    it("infers correct target directory given packages glob", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const targetDir = path.join(testDir, "pkg", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      await updateLernaConfig(testDir, {
        packages: ["pkg/*"],
      });

      try {
        await lernaImport(testDir)(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`Target directory already exists "${relativePath}"`);
      }
    });

    it("errors if repo has uncommitted changes", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const uncommittedFile = path.join(testDir, "uncommittedFile");

      await fs.writeFile(uncommittedFile, "stuff");
      await execa("git", ["add", uncommittedFile], { cwd: testDir });

      try {
        await lernaImport(testDir)(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe("Local repository has un-committed changes");
      }
    });

    it("does not remove custom subject prefixes in [brackets]", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await execa("git", ["commit", "-m", "[ISSUE-10] Moved old-file to new-file"], {
        cwd: externalDir,
      });

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("[ISSUE-10] Moved old-file to new-file");
      expect(await pathExists(newFilePath)).toBe(true);
    });
  });

  describe("with non-root Lerna dir", () => {
    // #1197
    it("creates a module in packages location with imported commit history", async () => {
      const [externalDir, rootDir] = await Promise.all([
        initFixture("ImportCommand/external", "Init external commit"),
        initFixture("ImportCommand/lerna-not-in-root"),
      ]);
      const testDir = path.join(rootDir, "subdir");
      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(rootDir)).toBe("Init external commit");
      expect(await pathExists(packageJson)).toBe(true);
    });
  });
});
