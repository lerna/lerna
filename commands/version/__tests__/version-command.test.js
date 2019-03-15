"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");

// mocked or stubbed modules
const writePkg = require("write-pkg");
const PromptUtilities = require("@lerna/prompt");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");
const checkWorkingTree = require("@lerna/check-working-tree");
const libPush = require("../lib/git-push");
const isAnythingCommitted = require("../lib/is-anything-committed");
const isBehindUpstream = require("../lib/is-behind-upstream");
const remoteBranchExists = require("../lib/remote-branch-exists");

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
  // git ls-files --exclude-standard --modified --others
  execa("git", ["ls-files", "--exclude-standard", "--modified", "--others"], { cwd }).then(result =>
    result.stdout.split("\n").filter(Boolean)
  );

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("VersionCommand", () => {
  describe("normal mode", () => {
    beforeEach(() => {
      checkWorkingTree.mockReset();
    });
    it("versions changed packages", async () => {
      const testDir = await initFixture("normal");
      // when --conventional-commits is absent,
      // --no-changelog should have _no_ effect
      await lernaVersion(testDir)("--no-changelog");

      expect(checkWorkingTree).toHaveBeenCalled();

      expect(PromptUtilities.select.mock.calls).toMatchSnapshot("prompt");
      expect(PromptUtilities.confirm).toHaveBeenLastCalledWith(
        "Are you sure you want to create these versions?"
      );

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(libPush).toHaveBeenLastCalledWith(
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

    it("throws an error if conventional prerelease and graduate flags are both passed", async () => {
      const testDir = await initFixture("normal");

      try {
        await lernaVersion(testDir)("--conventional-prerelease", "--conventional-graduate");
      } catch (err) {
        expect(err.message).toMatchInlineSnapshot(
          `"--conventional-prerelease cannot be combined with --conventional-graduate."`
        );
      }

      expect.assertions(1);
    });

    it("throws an error when remote branch doesn't exist", async () => {
      remoteBranchExists.mockReturnValueOnce(false);

      const testDir = await initFixture("normal");

      try {
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.message).toMatch("doesn't exist in remote");
      }

      expect.assertions(1);
    });

    it("throws an error when uncommitted changes are present", async () => {
      checkWorkingTree.mockImplementationOnce(() => {
        throw new Error("uncommitted");
      });

      const testDir = await initFixture("normal");

      try {
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.message).toBe("uncommitted");
        // notably different than the actual message, but good enough here
      }

      expect.assertions(1);
    });

    it("throws an error when current ref is already tagged", async () => {
      checkWorkingTree.mockImplementationOnce(() => {
        throw new Error("released");
      });

      const testDir = await initFixture("normal");

      try {
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.message).toBe("released");
        // notably different than the actual message, but good enough here
      }

      expect.assertions(1);
    });

    it("does not throw if current ref is already tagged when using --force-publish", async () => {
      checkWorkingTree.mockImplementationOnce(() => {
        throw new Error("released");
      });

      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--force-publish");

      expect.assertions(0);
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

      expect(PromptUtilities.confirm).toHaveBeenCalled();

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(libPush).toHaveBeenLastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(output.logged()).toMatchSnapshot("console output");
    });
  });

  describe("--no-commit-hooks", () => {
    const setupPreCommitHook = cwd =>
      fs.outputFile(path.join(cwd, ".git/hooks/pre-commit"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });

    it("passes --no-verify to git commit execution", async () => {
      const cwd = await initFixture("normal");

      await setupPreCommitHook(cwd);
      await lernaVersion(cwd)("--no-commit-hooks");

      const message = await getCommitMessage(cwd);
      expect(message).toBe("v1.0.1");
    });

    it("consumes configuration from lerna.json", async () => {
      const cwd = await initFixture("normal");

      await setupPreCommitHook(cwd);
      await fs.outputJSON(path.join(cwd, "lerna.json"), {
        version: "1.0.0",
        command: {
          publish: {
            commitHooks: false,
          },
        },
      });
      await lernaVersion(cwd)();

      const message = await getCommitMessage(cwd);
      expect(message).toBe("v1.0.1");
    });
  });

  describe("--no-git-tag-version", () => {
    it("versions changed packages without git commit or push", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--no-git-tag-version");

      expect(writePkg.updatedManifest("package-1")).toMatchSnapshot("gitHead");

      expect(libPush).not.toHaveBeenCalled();

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

    it("consumes configuration from lerna.json", async () => {
      const testDir = await initFixture("normal");

      await fs.outputJSON(path.join(testDir, "lerna.json"), {
        version: "1.0.0",
        command: {
          publish: {
            gitTagVersion: false,
          },
        },
      });
      await lernaVersion(testDir)();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git tag/commit");
    });

    it("is implied by --skip-git", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--skip-git");

      const logMessages = loggingOutput();
      expect(logMessages).toContain("Skipping git tag/commit");
      expect(logMessages).toContain("--skip-git has been replaced by --no-git-tag-version --no-push");
    });

    it("skips dirty working tree validation", async () => {
      const testDir = await initFixture("normal");
      await fs.outputFile(path.join(testDir, "packages/package-1/hello.js"), "world");
      await lernaVersion(testDir)("--no-git-tag-version");

      expect(checkWorkingTree).not.toHaveBeenCalled();

      const logMessages = loggingOutput("warn");
      expect(logMessages).toContain("Skipping working tree validation, proceed at your own risk");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toContain("packages/package-1/hello.js");
    });
  });

  describe("--no-push", () => {
    it("versions changed packages without git push", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--no-push");

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();

      expect(libPush).not.toHaveBeenCalled();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git push");

      const unstaged = await listDirty(testDir);
      expect(unstaged).toEqual([]);
    });

    it("consumes configuration from lerna.json", async () => {
      const testDir = await initFixture("normal");

      await fs.outputJSON(path.join(testDir, "lerna.json"), {
        version: "1.0.0",
        command: {
          publish: {
            push: false,
          },
        },
      });
      await lernaVersion(testDir)();

      const logMessages = loggingOutput("info");
      expect(logMessages).toContain("Skipping git push");
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

    it("consumes configuration from lerna.json", async () => {
      const testDir = await initFixture("normal");

      await fs.outputJSON(path.join(testDir, "lerna.json"), {
        version: "1.0.0",
        command: {
          publish: {
            tagVersionPrefix: "durable",
          },
        },
      });
      await lernaVersion(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toContain("tag: durable1.0.1");
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

      expect(PromptUtilities.select).not.toHaveBeenCalled();
      expect(PromptUtilities.confirm).not.toHaveBeenCalled();

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

      expect(libPush).toHaveBeenLastCalledWith(
        "upstream",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });

    it("consumes configuration from lerna.json", async () => {
      const testDir = await initFixture("normal");

      await fs.outputJSON(path.join(testDir, "lerna.json"), {
        version: "1.0.0",
        command: {
          publish: {
            gitRemote: "durable",
          },
        },
      });
      await lernaVersion(testDir)();

      expect(libPush).toHaveBeenLastCalledWith(
        "durable",
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

      expect(checkWorkingTree).not.toHaveBeenCalled();
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

  describe("unversioned packages", () => {
    it("exits with an error for non-private packages with no version", async () => {
      const testDir = await initFixture("not-versioned");
      try {
        await lernaVersion(testDir)();
      } catch (err) {
        expect(err.prefix).toBe("ENOVERSION");
        expect(err.message).toMatch("A version field is required in package-3's package.json file.");
      }
    });

    it("ignores private packages with no version", async () => {
      const testDir = await initFixture("not-versioned-private");
      await lernaVersion(testDir)();
      expect(Object.keys(writePkg.updatedVersions())).not.toContain("package-4");
    });
  });

  describe("working on a detached HEAD", () => {
    const detachedHEAD = async (fixture = "normal") => {
      const cwd = await initFixture(fixture);
      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd });
      return cwd;
    };

    it("throws for version", async () => {
      try {
        const cwd = await detachedHEAD();
        await lernaVersion(cwd)();
      } catch (err) {
        expect(err.prefix).toBe("ENOGIT");
        expect(err.message).toBe("Detached git HEAD, please checkout a branch to choose versions.");
      }

      expect.assertions(2);
    });

    it("does not throw for version --no-git-tag-version", async () => {
      const cwd = await detachedHEAD();
      await lernaVersion(cwd)("--no-git-tag-version");
      const unstaged = await listDirty(cwd);
      expect(unstaged).toEqual([
        "lerna.json",
        "packages/package-1/package.json",
        "packages/package-2/package.json",
        "packages/package-3/package.json",
        "packages/package-4/package.json",
        "packages/package-5/package.json",
      ]);
    });

    it("throws for version --conventional-commits", async () => {
      try {
        const cwd = await detachedHEAD();
        await lernaVersion(cwd)("--no-git-tag-version", "--conventional-commits");
      } catch (err) {
        expect(err.prefix).toBe("ENOGIT");
        expect(err.message).toBe("Detached git HEAD, please checkout a branch to choose versions.");
      }

      expect.assertions(2);
    });

    it("throws for version --allow-branch", async () => {
      try {
        const cwd = await detachedHEAD();
        await lernaVersion(cwd)("--no-git-tag-version", "--allow-branch", "master");
      } catch (err) {
        expect(err.prefix).toBe("ENOGIT");
        expect(err.message).toBe("Detached git HEAD, please checkout a branch to choose versions.");
      }

      expect.assertions(2);
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
    const cwd = await initFixture("no-interdependencies");

    try {
      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd }); // detach head

      await lernaVersion(cwd)();
    } catch (err) {
      expect(err.prefix).toBe("ENOGIT");
      expect(err.message).toBe("Detached git HEAD, please checkout a branch to choose versions.");
    }
  });

  it("exits early when no changes found", async () => {
    const cwd = await initFixture("normal");

    collectUpdates.setUpdated(cwd);

    await lernaVersion(cwd)();

    const logMessages = loggingOutput("success");
    expect(logMessages).toContain("No changed packages to version");
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

  describe("--include-merged-tags", () => {
    it("accepts --include-merged-tags", async () => {
      const testDir = await initFixture("normal");
      await lernaVersion(testDir)("--include-merged-tags", "--yes", "patch");

      expect(PromptUtilities.select).not.toHaveBeenCalled();
      expect(PromptUtilities.confirm).not.toHaveBeenCalled();

      const message = await getCommitMessage(testDir);
      expect(message).toBe("v1.0.1");
    });
  });
});
