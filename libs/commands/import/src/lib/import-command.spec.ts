import { promptConfirmation as _promptConfirmation } from "@lerna/core";
import {
  commandRunner,
  gitAdd,
  gitCommit,
  initFixtureFactory,
  initNamedFixtureFactory,
  updateLernaConfig,
} from "@lerna/test-helpers";
import execa from "execa";
import fs from "fs-extra";
import path from "path";

const promptConfirmation = jest.mocked(_promptConfirmation);

const initFixture = initFixtureFactory(__dirname);
const initNamedFixture = initNamedFixtureFactory(__dirname);

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaImport = commandRunner(require("../command"));

// assertion helpers
const lastCommitInDir = (cwd) =>
  execa("git", ["log", "-1", "--format=%s"], { cwd }).then((result) => result.stdout);

describe("ImportCommand", () => {
  promptConfirmation.mockResolvedValue(true);

  describe("import", () => {
    const initBasicFixtures = async () => {
      const externalDir = await initFixture("external", "Init external commit");
      const testDir = await initFixture("basic");
      return [testDir, externalDir];
    };

    it("creates a module in packages location with imported commit history", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init external commit");
      expect(fs.existsSync(packageJson)).toBe(true);
    });

    it("imports a repo with conflicted merge commits when run with --flatten", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const branchName = "conflict_branch";
      const conflictedFileName = "conflicted-file.txt";
      const conflictedFile = path.join(externalDir, conflictedFileName);
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), conflictedFileName);

      await fs.writeFile(conflictedFile, "initial content");
      await gitAdd(externalDir, conflictedFileName);
      await gitCommit(externalDir, "Initial content written");

      await execa("git", ["checkout", "-b", branchName], { cwd: externalDir });

      await fs.writeFile(conflictedFile, "branch content");
      await gitAdd(externalDir, conflictedFileName);
      await gitCommit(externalDir, "branch content written");

      await execa("git", ["checkout", "main"], { cwd: externalDir });

      await fs.writeFile(conflictedFile, "main content");
      await gitAdd(externalDir, conflictedFileName);
      await gitCommit(externalDir, "main content written");

      try {
        await execa("git", ["merge", branchName], { cwd: externalDir });
      } catch (e) {
        // skip
      }

      await fs.writeFile(conflictedFile, "merged content");
      await gitAdd(externalDir, conflictedFileName);
      await gitCommit(externalDir, "Branch merged");

      await lernaImport(testDir)(externalDir, "--flatten");

      expect(await lastCommitInDir(testDir)).toBe("Branch merged");
      expect(fs.existsSync(newFilePath)).toBe(true);
    });

    it("imports a repo into the root directory when packages are located there", async () => {
      const externalDir = await initNamedFixture("myapp-foo", "external", "myapp-foo init commit");
      const testDir = await initFixture("root-packages");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("myapp-foo init commit");
      expect(fs.existsSync(path.join(testDir, "myapp-foo/old-file"))).toBe(true);
      expect(fs.existsSync(path.join(testDir, "myapp-foo/package.json"))).toBe(true);
    });

    it("supports moved files within the external repo", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await gitCommit(externalDir, "Moved old-file to new-file");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Moved old-file to new-file");
      expect(fs.existsSync(newFilePath)).toBe(true);
    });

    it("supports filepaths that have spaces within the external repo", async () =>
      Promise.all(
        // running the same test with and without --flatten
        [true, false].map(async (shouldFlatten) => {
          const externalDir = await initFixture("files-with-spaces", "Init external commit");
          const testDir = await initFixture("basic");
          const newPackagePath = path.join(testDir, "packages", path.basename(externalDir));
          const newFilePath = path.join(newPackagePath, "file with spaces");
          const newDeepFilePath = path.resolve(newPackagePath, "subfolder b/file");

          if (shouldFlatten) {
            await lernaImport(testDir)(externalDir, "--flatten");
          } else {
            await lernaImport(testDir)(externalDir);
          }

          expect(await lastCommitInDir(testDir)).toBe("Init external commit");
          expect(fs.existsSync(newFilePath)).toBe(true);
          expect(fs.existsSync(newDeepFilePath)).toBe(true);
        })
      ));

    it("supports filepaths that have non-ascii char within the external repo", async () =>
      Promise.all(
        // running the same test with and without --flatten
        [true, false].map(async (shouldFlatten) => {
          const externalDir = await initFixture("files-with-non-ascii-char", "Init external commit");
          const testDir = await initFixture("basic");
          const newPackagePath = path.join(testDir, "packages", path.basename(externalDir));

          await fs.copy(path.join(externalDir, "檔案"), path.join(externalDir, "檔案-copy"));
          await gitAdd(externalDir, "檔案-copy");
          await gitCommit(externalDir, "copy");

          await fs.move(path.join(externalDir, "檔案"), path.join(externalDir, "檔案-rename"));
          await gitAdd(externalDir, "檔案", "檔案-rename");
          await gitCommit(externalDir, "rename");

          const copyFilePath = path.join(newPackagePath, "檔案-copy");
          const renameFilePath = path.join(newPackagePath, "檔案-rename");

          if (shouldFlatten) {
            await lernaImport(testDir)(externalDir, "--flatten");
          } else {
            await lernaImport(testDir)(externalDir);
          }

          expect(await lastCommitInDir(testDir)).toBe("rename");
          expect(fs.existsSync(copyFilePath)).toBe(true);
          expect(fs.existsSync(renameFilePath)).toBe(true);
        })
      ));

    it("skips empty patches with --flatten", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const filePath = path.join(externalDir, "file.txt");

      await fs.writeFile(filePath, "non-empty content");
      await gitAdd(externalDir, filePath);
      await gitCommit(externalDir, "Non-empty commit");

      await execa("git", ["commit", "--allow-empty", "-m", "Empty commit"], { cwd: externalDir });

      await lernaImport(testDir)(externalDir, "--flatten");

      expect(await lastCommitInDir(testDir)).toBe("Non-empty commit");
    });

    it("exits early when confirmation is rejected", async () => {
      const [testDir, externalDir] = await initBasicFixtures();

      promptConfirmation.mockResolvedValueOnce(false);

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init commit");
    });

    it("preserves original committer and date with --preserve-commit", async () =>
      Promise.all(
        // running the same test with and without --preserve-commit
        [true, false].map(async (shouldPreserve) => {
          const [testDir, externalDir] = await initBasicFixtures();
          const filePath = path.join(externalDir, "old-file");
          let expectedEmail;
          let expectedName;

          await execa("git", ["config", "user.name", "'test-name'"], { cwd: externalDir });
          await execa("git", ["config", "user.email", "'test-email@foo.bar'"], { cwd: externalDir });
          await fs.writeFile(filePath, "non-empty content");
          await gitAdd(externalDir, filePath);
          await gitCommit(externalDir, "Non-empty commit");

          if (shouldPreserve) {
            await lernaImport(testDir)(externalDir, "--preserve-commit");
            // original committer
            expectedEmail = "test-email@foo.bar";
            expectedName = "test-name";
          } else {
            await lernaImport(testDir)(externalDir);
            // whatever the current git user is
            expectedEmail = execa.sync("git", ["config", "user.email"], { cwd: testDir }).stdout;
            expectedName = execa.sync("git", ["config", "user.name"], { cwd: testDir }).stdout;
          }

          expect(execa.sync("git", ["log", "-1", "--format=%cn <%ce>"], { cwd: testDir }).stdout).toBe(
            `${expectedName} <${expectedEmail}>`
          );
        })
      ));

    it("allows skipping confirmation prompt", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      await lernaImport(testDir)(externalDir, "--yes");

      expect(promptConfirmation).not.toHaveBeenCalled();
    });

    it("errors without an argument", async () => {
      const [testDir] = await initBasicFixtures();

      const command = lernaImport(testDir)();
      await expect(command).rejects.toThrow("Not enough non-option arguments: got 0, need at least 1");
    });

    it("errors when external directory is missing", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const missing = `${externalDir}_invalidSuffix`;

      const command = lernaImport(testDir)(missing);
      await expect(command).rejects.toThrow(`No repository found at "${missing}"`);
    });

    it("errors when external package.json is missing", async () => {
      const [testDir, externalDir] = await initBasicFixtures();

      await fs.unlink(path.join(externalDir, "package.json"));

      const command = lernaImport(testDir)(externalDir);
      await expect(command).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining("package.json"),
          code: "MODULE_NOT_FOUND",
        })
      );
    });

    it("errors when external package.json has no name property", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const packageJson = path.join(externalDir, "package.json");

      await fs.writeFile(packageJson, "{}");

      const command = lernaImport(testDir)(externalDir);
      await expect(command).rejects.toThrow(`No package name specified in "${packageJson}"`);
    });

    it("errors if target directory exists", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const targetDir = path.join(testDir, "packages", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      const command = lernaImport(testDir)(externalDir);
      await expect(command).rejects.toThrow(`Target directory already exists "${relativePath}"`);
    });

    it("infers correct target directory given packages glob", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const targetDir = path.join(testDir, "pkg", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      updateLernaConfig(testDir, {
        packages: ["pkg/*"],
      });

      const command = lernaImport(testDir)(externalDir);
      await expect(command).rejects.toThrow(`Target directory already exists "${relativePath}"`);
    });

    it("errors if repo has uncommitted changes", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const uncommittedFile = path.join(testDir, "uncommittedFile");

      await fs.writeFile(uncommittedFile, "stuff");
      await gitAdd(testDir, uncommittedFile);

      const command = lernaImport(testDir)(externalDir);
      await expect(command).rejects.toThrow("Local repository has un-committed changes");
    });

    it("does not remove custom subject prefixes in [brackets]", async () => {
      const [testDir, externalDir] = await initBasicFixtures();
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await gitCommit(externalDir, "[ISSUE-10] Moved old-file to new-file");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("[ISSUE-10] Moved old-file to new-file");
      expect(fs.existsSync(newFilePath)).toBe(true);
    });
  });

  describe("with non-root Lerna dir", () => {
    // #1197
    it("creates a module in packages location with imported commit history", async () => {
      const externalDir = await initFixture("external", "Init external commit");
      const rootDir = await initFixture("lerna-not-in-root");
      const testDir = path.join(rootDir, "subdir");
      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(testDir)(externalDir);

      expect(await lastCommitInDir(rootDir)).toBe("Init external commit");
      expect(fs.existsSync(packageJson)).toBe(true);
    });
  });

  describe("with multi-packages Lerna dir", () => {
    it("creates a module in specified package directory", async () => {
      const externalDir = await initFixture("external", "Init external commit");
      const testDir = await initFixture("multi-packages");

      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(testDir)(externalDir, "--dest=packages");

      expect(await lastCommitInDir(testDir)).toBe("Init external commit");
      expect(fs.existsSync(packageJson)).toBe(true);
    });

    it("throws error when the package directory does not match with config", async () => {
      const externalDir = await initFixture("external", "Init external commit");
      const testDir = await initFixture("multi-packages");

      const command = lernaImport(testDir)(externalDir, "--dest=components");
      await expect(command).rejects.toThrow(
        "--dest does not match with the package directories: core,packages"
      );
    });
  });
});
