"use strict";

const execa = require("execa");
const log = require("npmlog");
const path = require("path");
const touch = require("touch");

// helpers
const consoleOutput = require("./helpers/consoleOutput");
const initFixture = require("./helpers/initFixture");
const updateLernaConfig = require("./helpers/updateLernaConfig");

// file under test
const lernaUpdated = require("./helpers/yargsRunner")(require("../src/commands/UpdatedCommand"));

// silence logs
log.level = "silent";

const gitTag = cwd => execa("git", ["tag", "v1.0.0"], { cwd });
const gitAdd = cwd => execa("git", ["add", "-A"], { cwd });
const gitCommit = cwd => execa("git", ["commit", "-m", "Commit"], { cwd });
const touchFile = cwd => filePath => touch(path.join(cwd, filePath));

const setupGitChanges = async (cwd, filePaths) => {
  await gitTag(cwd);
  await Promise.all(filePaths.map(touchFile(cwd)));
  await gitAdd(cwd);
  await gitCommit(cwd);
};

describe("UpdatedCommand", () => {
  afterEach(() => jest.resetAllMocks());

  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("basic", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list all packages when no tag is found", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaUpdated(testDir)("--force-publish");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2,package-4", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaUpdated(testDir)("--force-publish", "package-2,package-4");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2 --force-publish package-4", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaUpdated(testDir)("--force-publish", "package-2", "--force-publish", "package-4");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await updateLernaConfig(testDir, {
        commands: {
          // "command" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes in private packages", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-5/random-file"]);
      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await gitTag(testDir);

      const { exitCode } = await lernaUpdated(testDir)();
      expect(exitCode).toBe(1);
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("circular", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("UpdatedCommand/circular");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish *", async () => {
      const testDir = await initFixture("UpdatedCommand/circular");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaUpdated(testDir)("--force-publish", "*");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2", async () => {
      const testDir = await initFixture("UpdatedCommand/circular");

      await setupGitChanges(testDir, ["packages/package-4/random-file"]);
      await lernaUpdated(testDir)("--force-publish", "package-2");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("UpdatedCommand/circular");

      await updateLernaConfig(testDir, {
        command: {
          // "commands" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaUpdated(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("UpdatedCommand/circular");

      await gitTag(testDir);

      const { exitCode } = await lernaUpdated(testDir)();
      expect(exitCode).toBe(1);
    });
  });

  /** =========================================================================
   * JSON Output
   * ======================================================================= */

  describe("with --json", () => {
    it("should list changes as a json object", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaUpdated(testDir)("--json");

      // Output should be a parseable string
      const jsonOutput = JSON.parse(consoleOutput());
      expect(jsonOutput).toMatchSnapshot();
    });
  });
});
