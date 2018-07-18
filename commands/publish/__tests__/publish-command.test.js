"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");
const execa = require("execa");

// mocked or stubbed modules
const writePkg = require("write-pkg");
const PromptUtilities = require("@lerna/prompt");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");
const gitPush = require("../lib/git-push");
const isAnythingCommitted = require("../lib/is-anything-committed");
const isBehindUpstream = require("../lib/is-behind-upstream");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const showCommit = require("@lerna-test/show-commit");
const getCommitMessage = require("@lerna-test/get-commit-message");

// file under test
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// certain tests need to use the real thing
const collectUpdatesActual = require.requireActual("@lerna/collect-updates");

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("PublishCommand", () => {
  describe("normal mode", () => {
    it("publishes changed packages", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)();

      expect(PromptUtilities.select.mock.calls).toMatchSnapshot("prompt");
      expect(PromptUtilities.confirm).toBeCalled();

      expect(writePkg.updatedManifest("package-1")).toEqual({
        name: "package-1",
        version: "1.0.1",
        gitHead: expect.stringMatching(/^[0-9a-f]{40}$/),
      });

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(npmPublish.registry).toMatchSnapshot("npm published");
      expect(npmDistTag.check).not.toBeCalled();

      expect(gitPush).lastCalledWith(
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
        await lernaPublish(testDir)("--independent");
      } catch (err) {
        expect(err.message).toMatch("independent");
      }
    });

    it("only bumps changed packages when non-major version selected", async () => {
      const testDir = await initFixture("normal");

      collectUpdates.setUpdated(testDir, "package-2");
      PromptUtilities.mockChoices("minor");

      await lernaPublish(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });

    it("bumps all packages when major version selected", async () => {
      const testDir = await initFixture("normal");

      collectUpdates.setUpdated(testDir, "package-1");
      PromptUtilities.mockChoices("major");

      await lernaPublish(testDir)();

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot();
    });
  });

  describe("independent mode", () => {
    it("publishes changed packages", async () => {
      // mock version prompt choices
      PromptUtilities.mockChoices("patch", "minor", "major", "minor", "patch");

      const testDir = await initFixture("independent");

      await lernaPublish(testDir)(); // --independent is only valid in InitCommand

      expect(PromptUtilities.confirm).toBeCalled();

      expect(writePkg.updatedManifest("package-2")).toEqual({
        name: "package-2",
        version: "2.1.0",
        dependencies: { "package-1": "^1.0.1" },
        gitHead: expect.stringMatching(/^[0-9a-f]{40}$/),
      });

      const patch = await showCommit(testDir);
      expect(patch).toMatchSnapshot("commit");

      expect(npmPublish.registry).toMatchSnapshot("npm published");
      expect(npmDistTag.check).not.toBeCalled();

      expect(gitPush).lastCalledWith(
        "origin",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
      expect(output.logged()).toMatchSnapshot("console output");
    });
  });

  describe("--registry", () => {
    it("passes registry to npm commands", async () => {
      const testDir = await initFixture("normal");
      const registry = "https://my-private-registry";

      await lernaPublish(testDir)("--registry", registry);

      expect(npmPublish).lastCalledWith(
        expect.objectContaining({ name: "package-2" }),
        undefined,
        expect.objectContaining({ registry })
      );
    });
  });

  describe("--git-remote", () => {
    it("pushes tags to specified remote", async () => {
      const testDir = await initFixture("normal");

      await lernaPublish(testDir)("--git-remote", "upstream");

      expect(gitPush).lastCalledWith(
        "upstream",
        "master",
        expect.objectContaining({
          cwd: testDir,
        })
      );
    });
  });

  describe("--amend", () => {
    it("commits changes on the previous commit", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toMatch("Init commit");
    });

    it("ignores custom messages", async () => {
      const testDir = await initFixture("normal");
      await lernaPublish(testDir)("--message", "chore: Release %v :rocket:", "--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toMatch("Init commit");
    });
  });

  describe("--amend --independent", () => {
    it("commits changes with a custom message", async () => {
      const testDir = await initFixture("independent");
      await lernaPublish(testDir)("--amend");

      const message = await getCommitMessage(testDir);
      expect(message).toMatch("Init commit");
    });
  });

  describe("when local clone is behind upstream", () => {
    it("throws an error during interactive publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      try {
        await lernaPublish(testDir)();
      } catch (err) {
        expect(err.message).toMatch("behind remote upstream");
        expect(err.message).toMatch("Please merge remote changes");
      }
    });

    it("logs a warning and exits early during CI publish", async () => {
      const testDir = await initFixture("normal");

      isBehindUpstream.mockReturnValueOnce(true);

      await lernaPublish(testDir)("--ci");

      const [warning] = loggingOutput("warn");
      expect(warning).toMatch("behind remote upstream");
      expect(warning).toMatch("exiting");
    });
  });

  it("exists with an error when no commits are present", async () => {
    expect.assertions(2);
    const testDir = await initFixture("normal", false);

    isAnythingCommitted.mockReturnValueOnce(false);

    try {
      await lernaPublish(testDir)();
    } catch (err) {
      expect(err.prefix).toBe("ENOCOMMIT");
      expect(err.message).toBe(
        "No commits in this repository. Please commit something before using publish."
      );
    }
  });

  it("exits with an error when git HEAD is detached", async () => {
    const cwd = await initFixture("normal-no-inter-dependencies");

    try {
      const sha = await execa.stdout("git", ["rev-parse", "HEAD"], { cwd });
      await execa("git", ["checkout", sha], { cwd }); // detach head

      await lernaPublish(cwd)();
    } catch (err) {
      expect(err.prefix).toBe("ENOGIT");
      expect(err.message).toBe("Detached git HEAD, please checkout a branch to publish changes.");
    }
  });

  it("publishes all transitive dependents after change", async () => {
    const testDir = await initFixture("snake-graph");

    await gitTag(testDir, "v1.0.0");
    await fs.outputFile(path.join(testDir, "packages/package-1/hello.js"), "world");
    await gitAdd(testDir, ".");
    await gitCommit(testDir, "feat: hello");

    collectUpdates.mockImplementationOnce(collectUpdatesActual);

    await lernaPublish(testDir)("--cd-version", "major", "--yes");

    expect(PromptUtilities.select).not.toBeCalled();
    expect(PromptUtilities.confirm).not.toBeCalled();
    expect(showCommit(testDir)).toMatchSnapshot();
  });

  describe("in a cyclical repo", () => {
    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("toposort");

        await lernaPublish(testDir)("--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
