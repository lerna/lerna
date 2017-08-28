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

const lastCommitInDir = (cwd) =>
  execa.sync("git", ["log", "-1", "--format=%s"], { cwd }).stdout;

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

      expect(lastCommitInDir(testDir)).toBe("Init external commit");
      expect(await pathExists(packageJson)).toBe(true);
    });

    it.skip("works with --max-buffer", async () => {
      await lernaImport(externalDir, "--max-buffer=1");
      // TODO: this test kinda sucks, should never have to read instance properties
      // expect(importCommand.execOpts).toHaveProperty("maxBuffer", ONE_HUNDRED_MEGABYTES);
      // expect(importCommand.externalExecOpts).toHaveProperty("maxBuffer", ONE_HUNDRED_MEGABYTES);
    });

    it("supports moved files within the external repo", async () => {
      const newFilePath = path.join(testDir, "packages", path.basename(externalDir), "new-file");

      execa.sync("git", ["mv", "old-file", "new-file"], { cwd: externalDir });
      execa.sync("git", ["commit", "-m", "Moved old-file to new-file"], { cwd: externalDir });

      await lernaImport(externalDir);

      expect(lastCommitInDir(testDir)).toBe("Moved old-file to new-file");
      expect(pathExists.sync(newFilePath)).toBe(true);
    });

    it("exits early when confirmation is rejected", async () => {
      PromptUtilities.confirm = jest.fn(callsBack(false));

      await lernaImport(externalDir);

      expect(lastCommitInDir(testDir)).toBe("Init commit");
    });

    it("allows skipping confirmation prompt", async () => {
      const { exitCode } = await lernaImport(externalDir, "--yes");
      expect(exitCode).toBe(0);
    });

    it("errors without an argument", async () => {
      try {
        await lernaImport();
      } catch (err) {
        expect(err.message).toBe("Not enough non-option arguments: got 0, need at least 1");
      }
    });

    it("errors when external directory is missing", async () => {
      const missing = externalDir + "_invalidSuffix";

      try {
        await lernaImport(missing);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe(`No repository found at "${missing}"`);
      }
    });

    it("errors when external package.json is missing", async () => {
      fs.unlinkSync(path.join(externalDir, "package.json"));

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

      fs.writeFileSync(packageJson, "{}");

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

      fs.ensureDirSync(targetDir);

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

      fs.ensureDirSync(targetDir);

      updateLernaConfig(testDir, {
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

      fs.writeFileSync(uncommittedFile, "stuff");
      execa.sync("git", ["add", uncommittedFile], { cwd: testDir });

      try {
        await lernaImport(externalDir);
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toBe("Local repository has un-committed changes");
      }
    });
  });
});
