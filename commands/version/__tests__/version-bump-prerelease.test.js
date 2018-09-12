"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");
jest.unmock("@lerna/conventional-commits");

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const showCommit = require("@lerna-test/show-commit");
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const getCommitMessage = require("@lerna-test/get-commit-message");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-changelog"));

const setupChanges = async cwd => {
  await gitTag(cwd, "v1.0.1-beta.3");
  await fs.outputFile(path.join(cwd, "packages/package-3/hello.js"), "world");
  await gitAdd(cwd, ".");
  await gitCommit(cwd, "feat: setup");
};

test("version patch with previous prerelease also graduates prereleased", async () => {
  const testDir = await initFixture("republish-prereleased");
  // should republish 3, 4, and 5 because:
  // package 3 changed
  // package 5 has a prerelease version
  // package 4 depends on package 5

  await setupChanges(testDir);
  await lernaVersion(testDir)("patch");

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test("version prerelease with previous prerelease bumps changed only", async () => {
  const testDir = await initFixture("republish-prereleased");
  // should republish only package 3, because only it changed

  await setupChanges(testDir);
  await lernaVersion(testDir)("prerelease");

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test("version prerelease with previous prerelease supersedes --conventional-commits", async () => {
  const testDir = await initFixture("republish-prereleased");
  // version bump should stay prepatch --preid beta because ---conventional-commits is ignored

  await setupChanges(testDir);
  await lernaVersion(testDir)("prerelease", "--conventional-commits");

  const patch = await showCommit(testDir);
  expect(patch).toMatchSnapshot();
});

test("version prerelease with existing preid bumps with the preid provide as argument", async () => {
  const testDir = await initFixture("republish-prereleased");
  // Version bump should have the new rc preid
  await setupChanges(testDir);
  await lernaVersion(testDir)("prerelease", "--preid", "rc");

  const message = await getCommitMessage(testDir);
  expect(message).toBe("v1.0.1-rc.0");
});

test("version prerelease with immediate graduation", async () => {
  const testDir = await initFixture("republish-prereleased");

  await setupChanges(testDir);
  await lernaVersion(testDir)("prerelease", "--force-publish", "package-4");
  // package-4 had no changes, but should still be included for some mysterious reason

  const firstDiff = await showCommit(testDir);
  expect(firstDiff).toMatchSnapshot();

  // no changes, but force everything because the previous prerelease passed QA
  await lernaVersion(testDir)("patch", "--force-publish");

  const secondDiff = await showCommit(testDir);
  expect(secondDiff).toMatchSnapshot();
});
