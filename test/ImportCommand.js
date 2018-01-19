import execa from "execa";
import fs from "fs-extra";
import log from "npmlog";
import path from "path";
import pathExists from "path-exists";

// mocked or stubbed modules
import PromptUtilities from "../src/PromptUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import updateLernaConfig from "./helpers/updateLernaConfig";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/ImportCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/PromptUtilities");

// silence logs
log.level = "silent";

const lastCommitInDir = cwd => execa.stdout("git", ["log", "-1", "--format=%s"], { cwd });

describe("ImportCommand", () => {
  beforeEach(() => {
    PromptUtilities.confirm = jest.fn(callsBack(true));
  });

  afterEach(() => jest.resetAllMocks());

  describe("import", () => {
    let testDir;
    let externalDir;
    let lernaImport;

    beforeEach(async () => {
      const [extDir, basicDir] = await Promise.all([
        initFixture("ImportCommand/external", "Init external commit"),
        initFixture("ImportCommand/basic"),
      ]);

      externalDir = extDir;
      testDir = basicDir;
      lernaImport = run(testDir);
    });

    it("creates a module in packages location with imported commit history", async () => {
      const packageJson = path.join(testDir, "packages", path.basename(externalDir), "package.json");
      await lernaImport(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init external commit");
      expect(await pathExists(packageJson)).toBe(true);
    });

    it("imports a repo with conflicted merge commits when run with --flatten", async () => {
      const cwdExternalDir = { cwd: externalDir };
      const branchName = "conflict_branch";
      const conflictedFileName = "conflicted-file.txt";
      const conflictedFile = path.join(externalDir, conflictedFileName);

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
      expect(await lastCommitInDir(externalDir)).toBe("Branch merged");

      await lernaImport(externalDir, "--flatten");
      expect(await lastCommitInDir(testDir)).toBe("Branch merged");

      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), conflictedFileName);
      expect(await pathExists(newFilePath)).toBe(true);
    });

    // FIXME: this test kinda sucks, should never have to read instance properties
    // it("works with --max-buffer", async () => {
    //   await lernaImport(externalDir, "--max-buffer=1");
    // });

    it("supports moved files within the external repo", async () => {
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await execa("git", ["commit", "-m", "Moved old-file to new-file"], {
        cwd: externalDir,
      });

      await lernaImport(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Moved old-file to new-file");
      expect(await pathExists(newFilePath)).toBe(true);
    });

    it("skips empty patches with --flatten", async () => {
      const cwdExternalDir = { cwd: externalDir };
      const filePath = path.join(externalDir, "file.txt");

      await fs.writeFile(filePath, "non-empty content");
      await execa("git", ["add", filePath], cwdExternalDir);
      await execa("git", ["commit", "-m", "Non-empty commit"], cwdExternalDir);

      await execa("git", ["commit", "--allow-empty", "-m", "Empty commit"], cwdExternalDir);

      const { exitCode } = await lernaImport(externalDir, "--flatten");

      expect(await lastCommitInDir(testDir)).toBe("Non-empty commit");
      expect(exitCode).toBe(0);
    });

    it("exits early when confirmation is rejected", async () => {
      PromptUtilities.confirm = jest.fn(callsBack(false));

      await lernaImport(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init commit");
    });

    it("allows skipping confirmation prompt", async () => {
      const { exitCode } = await lernaImport(externalDir, "--yes");

      expect(exitCode).toBe(0);
      expect(PromptUtilities.confirm).not.toBeCalled();
    });

    it("errors without an argument", async () => {
      try {
        await lernaImport();
      } catch (err) {
        expect(err.message).toBe("Not enough non-option arguments: got 0, need at least 1");
      }
    });

    it("errors when external directory is missing", async () => {
      const missing = `${externalDir}_invalidSuffix`;

      try {
        await lernaImport(missing);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`No repository found at "${missing}"`);
      }
    });

    it("errors when external package.json is missing", async () => {
      await fs.unlink(path.join(externalDir, "package.json"));

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toMatch("package.json");
        expect(err.code).toBe("MODULE_NOT_FOUND");
      }
    });

    it("errors when external package.json has no name property", async () => {
      const packageJson = path.join(externalDir, "package.json");

      await fs.writeFile(packageJson, "{}");

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`No package name specified in "${packageJson}"`);
      }
    });

    it("errors if target directory exists", async () => {
      const targetDir = path.join(testDir, "packages", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`Target directory already exists "${relativePath}"`);
      }
    });

    it("infers correct target directory given packages glob", async () => {
      const targetDir = path.join(testDir, "pkg", path.basename(externalDir));
      const relativePath = path.relative(testDir, targetDir);

      await fs.ensureDir(targetDir);

      await updateLernaConfig(testDir, {
        packages: ["pkg/*"],
      });

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`Target directory already exists "${relativePath}"`);
      }
    });

    it("errors if repo has uncommitted changes", async () => {
      const uncommittedFile = path.join(testDir, "uncommittedFile");

      await fs.writeFile(uncommittedFile, "stuff");
      await execa("git", ["add", uncommittedFile], { cwd: testDir });

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe("Local repository has un-committed changes");
      }
    });

    it("does not remove custom subject prefixes in [brackets]", async () => {
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      await execa("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      await execa("git", ["commit", "-m", "[ISSUE-10] Moved old-file to new-file"], {
        cwd: externalDir,
      });

      await lernaImport(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("[ISSUE-10] Moved old-file to new-file");
      expect(await pathExists(newFilePath)).toBe(true);
    });
  });

  describe("with non-root Lerna dir", () => {
    let testDir;
    let lernaRootDir;
    let externalDir;
    let lernaImport;

    beforeEach(async () => {
      const [extDir, fixtureDir] = await Promise.all([
        initFixture("ImportCommand/external", "Init external commit"),
        initFixture("ImportCommand/lerna-not-in-root"),
      ]);

      externalDir = extDir;
      testDir = fixtureDir;
      lernaRootDir = path.join(testDir, "subdir");
      lernaImport = run(lernaRootDir);
    });

    // Issue 1197
    it("creates a module in packages location with imported commit history", async () => {
      const packageJson = path.join(lernaRootDir, "packages", path.basename(externalDir), "package.json");

      await lernaImport(externalDir);

      expect(await lastCommitInDir(testDir)).toBe("Init external commit");
      expect(await pathExists(packageJson)).toBe(true);
    });
  });
});
