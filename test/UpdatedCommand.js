import chalk from "chalk";
import execa from "execa";
import log from "npmlog";
import normalizeNewline from "normalize-newline";
import path from "path";
import touch from "touch";

// mocked or stubbed modules
import output from "../src/utils/output";

// helpers
import initFixture from "./helpers/initFixture";
import updateLernaConfig from "./helpers/updateLernaConfig";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/UpdatedCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

// keep snapshots stable cross-platform
chalk.enabled = false;

const consoleOutput = () =>
  output.mock.calls.map((args) => normalizeNewline(args[0]));

const gitTag = (opts) => execa.sync("git", ["tag", "v1.0.0"], opts);
const gitAdd = (opts) => execa.sync("git", ["add", "-A"], opts);
const gitCommit = (opts) => execa.sync("git", ["commit", "-m", "Commit"], opts);
const touchFile = (opts) => (filePath) =>
    touch.sync(path.join(opts.cwd, filePath));

const setupGitChanges = (testDir, filePaths) => {
  const opts = {
    cwd: testDir,
  };
  gitTag(opts);
  filePaths.forEach(touchFile(opts));
  gitAdd(opts);
  gitCommit(opts);
};

describe("UpdatedCommand", async () => {
  afterEach(() => jest.resetAllMocks());

  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("basic", async () => {
    let testDir;
    let lernaUpdated;

    beforeEach(() => initFixture("UpdatedCommand/basic").then((dir) => {
      testDir = dir;
      lernaUpdated = run(testDir);
    }));

    it("should list changes", async () => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list all packages when no tag is found", async () => {
      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish *", async () => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      await lernaUpdated("--force-publish");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish [package,package]", async () => {
      setupGitChanges(testDir, [
        "packages/package-3/random-file",
      ]);

      await lernaUpdated("--force-publish", "package-2,package-4");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      updateLernaConfig(testDir, {
        commands: { // "command" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      setupGitChanges(testDir, [
        "packages/package-2/ignored-file",
        "packages/package-3/random-file",
      ]);

      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("throws an error when --only-explicit-updates is passed", async () => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      try {
        await lernaUpdated("--only-explicit-updates");
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.message).toMatch("--only-explicit-updates");
      }
    });

    it("should list changes in private packages", async () => {
      setupGitChanges(testDir, [
        "packages/package-5/random-file",
      ]);

      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      gitTag({ cwd: testDir });

      const { exitCode } = await lernaUpdated();
      expect(exitCode).toBe(1);
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("circular", async () => {
    let testDir;
    let lernaUpdated;

    beforeEach(() => initFixture("UpdatedCommand/circular").then((dir) => {
      testDir = dir;
      lernaUpdated = run(testDir);
    }));

    it("should list changes", async () => {
      setupGitChanges(testDir, [
        "packages/package-3/random-file",
      ]);

      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish *", async () => {
      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      await lernaUpdated("--force-publish=*");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes with --force-publish [package,package]", async () => {
      setupGitChanges(testDir, [
        "packages/package-4/random-file",
      ]);

      await lernaUpdated("--force-publish", "package-2");
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should list changes without ignored files", async () => {
      updateLernaConfig(testDir, {
        command: { // "commands" also supported
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      setupGitChanges(testDir, [
        "packages/package-2/ignored-file",
        "packages/package-3/random-file",
      ]);

      await lernaUpdated();
      expect(consoleOutput()).toMatchSnapshot();
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      gitTag({ cwd: testDir });

      const { exitCode } = await lernaUpdated();
      expect(exitCode).toBe(1);
    });
  });

  /** =========================================================================
   * JSON Output
   * ======================================================================= */

  describe("with --json", async () => {
    it("should list changes as a json object", async () => {
      const testDir = await initFixture("UpdatedCommand/basic");
      const lernaUpdated = run(testDir);

      setupGitChanges(testDir, [
        "packages/package-2/random-file",
      ]);

      await lernaUpdated("--json")

      // Output should be a parseable string
      const jsonOutput = JSON.parse(consoleOutput());
      expect(jsonOutput).toMatchSnapshot();
    });
  });
});
