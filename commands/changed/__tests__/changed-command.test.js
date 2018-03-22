"use strict";

const path = require("path");
const touch = require("touch");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const consoleOutput = require("@lerna-test/console-output");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const updateLernaConfig = require("@lerna-test/update-lerna-config");

// file under test
const lernaChanged = require("@lerna-test/command-runner")(require("../command"));

const touchFile = cwd => filePath => touch(path.join(cwd, filePath));

const setupGitChanges = async (cwd, filePaths) => {
  await gitTag(cwd, "v1.0.0");
  await Promise.all(filePaths.map(touchFile(cwd)));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "Commit");
};

describe("ChangedCommand", () => {
  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("basic", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list all packages when no tag is found", async () => {
      const testDir = await initFixture("basic");

      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--force-publish");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2,package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2,package-4");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2 --force-publish package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2", "--force-publish", "package-4");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("basic");

      await updateLernaConfig(testDir, {
        commands: {
          // "command" also supported
          publish: {
            ignoreChanges: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes in private packages", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-5/random-file"]);
      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("basic");

      await gitTag(testDir, "v1.0.0");
      await lernaChanged(testDir)();

      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("circular", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish *", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--force-publish", "*");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish package-2", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-4/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2");

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("circular");

      await updateLernaConfig(testDir, {
        command: {
          // "commands" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("circular");

      await gitTag(testDir, "v1.0.0");
      await lernaChanged(testDir)();

      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });
  });

  /** =========================================================================
   * JSON Output
   * ======================================================================= */

  describe("with --json", () => {
    it("should list changes as a json object", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--json");

      // Output should be a parseable string
      const jsonOutput = JSON.parse(consoleOutput());
      expect(jsonOutput).toMatchSnapshot();
    });
  });
});
