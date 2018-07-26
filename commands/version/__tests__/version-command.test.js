"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");

// mocked or stubbed modules
const writePkg = require("write-pkg");
const PromptUtilities = require("@lerna/prompt");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");
const libPush = require("../lib/git-push");
const isAnythingCommitted = require("../lib/is-anything-committed");
const isBehindUpstream = require("../lib/is-behind-upstream");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const showCommit = require("@lerna-test/show-commit");
const getCommitMessage = require("@lerna-test/get-commit-message");

// file under test
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// certain tests need to use the real thing
const collectUpdatesActual = require.requireActual("@lerna/collect-updates");

// assertion helpers
const listDirty = cwd =>
  execa("git", ["diff", "--name-only"], { cwd }).then(result => result.stdout.split("\n").filter(Boolean));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("VersionCommand", () => {
  describe("normal mode", () => {
    it("versions changed packages", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)();

      expect(PromptUtilities.select.mock.calls).toMatchSnapshot("prompt");
      expect(PromptUtilities.confirm).toBeCalled();

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(libPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(output.logged()).toMatchSnapshot("console output");
    });

    it("throws an error when --independent is passed", async () => {
      expect.assertions(1);
      const testDir = await initFixture("normal");
      try {
        await lernaVersion(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }
    });

    it("only bumps changed packages when non-major version selected", async () => {
      const testDir = await initFixture("normal");

      collectUpdates.setUpdated(testDir, "package-3");
      PromptUtilities.mockChoices("minor");

      await lernaVersion(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });

    it("bumps all packages when major version selected", async () => {
      const testDir = await initFixture("normal");

      collectUpdates.setUpdated(testDir, "package-3");
      PromptUtilities.mockChoices("major");

      await lernaVersion(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });
  });

  describe("independent mode", () => {
    it("versions changed packages", async () => {
      // mock version prompt choices
      PromptUtilities.mockChoices("patch", "minor", "major", "minor", "patch");

      const testDir = await initFixture("independent");
      await lernaVersion(testDir)(); // --independent is only valid in InitCommand

      expect(PromptUtilities.confirm).toBeCalled();

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(libPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(output.logged()).toMatchSnapshot("console output");
    });
  });

  describe("--no-git-tag-version", () => {
    it("versions changed packages without git commit or push", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--no-git-tag-version");

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      expect(libPush).not.toBeCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git tag/commit");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toEqual([
        "lerna.json",
        "packages/package-1/package.json",
        "packages/package-2/package.json",
        "packages/package-3/package.json",
        "packages/package-4/package.json",
        "packages/package-5/package.json",
      ]);
    });

    it("is implied by --skip-git", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--skip-git");

      const logMessages = loggingOutput();
      expect(logMessages).toContain("Skipping git tag/commit");
      expect(logMessages).toContain("--skip-git has been replaced by --no-git-tag-version --no-push");
    });
  });

  describe("--no-push", () => {
    it("versions changed packages without git push", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--no-push");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();

      expect(libPush).not.toBeCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git push");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toEqual([]);
    });

    it("is implied by --skip-git", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--skip-git");

      const logMessages = loggingOutput();
      expect(logMessages).toContain("Skipping git push");
      expect(logMessages).toContain("--skip-git has been replaced by --no-git-tag-version --no-push");
    });
  });

  describe("--tag-version-prefix", () => {
    it("versions changed packages with custom tag prefix", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--tag-version-prefix", "rev");

      const patch = await showCommit(testDir);
      expect(patch).toContain("tag: rev1.0.1");
    });

    it("omits tag prefix when passed empty string", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--tag-version-prefix", "");

      const patch = await showCommit(testDir);
      expect(patch).toContain("tag: 1.0.1");
    });
  });

  describe("--yes", () => {
    it("skips confirmation prompt", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--yes", "patch");

      expect(PromptUtilities.select).not.toBeCalled();
      expect(PromptUtilities.confirm).not.toBeCalled();

      const message = await getCommitMessage(testDir);
      expect(message).toBe("v1.0.1");
    });
  });

  describe("--exact", () => {
    it("updates matching local dependencies of published packages with exact versions", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--exact");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });

    it("updates existing exact versions", async () => {
      const testDir = await initFixture("normal-exact");
      await lernaVersion(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });
  });

  describe("--git-remote", () => {
    it("pushes tags to specified remote", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--git-remote", "upstream");

      expect(libPush).lastCalledWith(
        "upstream",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  describe("--amend", () => {
    it("amends the previous commit", async () => {
      const testDir = await initFixture("normal", "previous");
      await lernaVersion(testDir)("--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toBe("previous");
    });

    it("ignores custom messages", async () => {
      const testDir = await initFixture("normal", "preserved");
      await lernaVersion(testDir)("-m", "ignored", "--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toBe("preserved");
    });
  });

  describe("--amend --independent", () => {
    it("amends the previous commit", async () => {
      const testDir = await initFixture("independent", "previous");
      await lernaVersion(testDir)("--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toBe("previous");
    });
  });

  describe("when local clone is behind upstream", () => {
    it("throws an error during interactive publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      try {
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.message).toMatch("behind remote upstream");
        expect(err.message).toMatch("Please merge remote changes");
      }
    });

    it("logs a warning and exits early during CI publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      await lernaVersion(testDir)("--ci");

      const [warning] = loggingOutput("warn");
      expect(warning).toMatch("behind remote upstream");
      expect(warning).toMatch("exiting");
    });
  });

  it("exits with an error when no commits are present", async () => {
    expect.assertions(2);
    const testDir = await initFixture("normal", false);

    isAnythingCommitted.mockReturnValueOnce(false);

    try {
      await lernaVersion(testDir)();
    } catch (err) {
      expect(err.prefix).toBe("ENOCOMMIT");
      expect(err.message).toBe(
        "No commits in this repository. Please commit something before using version."
      );
    }
  });

  it("exits with an error when git HEAD is detached", async () => {
    const cwd = await initFixture("normal-no-inter-dependencies");

    try {
      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd }); // detach head

      await lernaVersion(cwd)();
    } catch (err) {
      expect(err.prefix).toBe("ENOGIT");
      expect(err.message).toBe("Detached git HEAD, please checkout a branch to choose versions.");
    }
  });

  it("versions all transitive dependents after change", async () => {
    const testDir = await initFixture("snake-graph");

    await gitTag(testDir, "v1.0.0");
    await fs.outputFile(path.join(testDir, "packages/package-1/hello.js"), "world");
    await gitAdd(testDir, ".");
    await gitCommit(testDir, "feat: hello");

    collectUpdates.mockImplementationOnce(collectUpdatesActual);

    await lernaVersion(testDir)("major", "--yes");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  describe("with relative file: specifiers", () => {
    const setupChanges = async (cwd, pkgRoot = "packages") => {
      await gitTag(cwd, "v1.0.0");
      await fs.outputFile(path.join(cwd, `${pkgRoot}/package-1/hello.js`), "world");
      await gitAdd(cwd, ".");
      await gitCommit(cwd, "setup");
    };

    it("does not overwrite relative specifier in git commit", async () => {
      const testDir = await initFixture("relative-file-specs");

      await setupChanges(testDir);
      await lernaVersion(testDir)("major", "--yes");

      expect(writePkg.updatedVersions()).toEqual({
        "package-1": "2.0.0",
        "package-2": "2.0.0",
        "package-3": "2.0.0",
        "package-4": "2.0.0",
        "package-5": "2.0.0",
        "package-6": "2.0.0",
        "package-7": "2.0.0",
      });

      // package-1 has no relative file: dependencies
      expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
        "package-1": "file:../package-1",
      });
      expect(writePkg.updatedManifest("package-3").dependencies).toMatchObject({
        "package-2": "file:../package-2",
      });
      expect(writePkg.updatedManifest("package-4").optionalDependencies).toMatchObject({
        "package-3": "file:../package-3",
      });
      expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
        "package-4": "file:../package-4",
        "package-6": "file:../package-6",
      });
    });
  });
});
