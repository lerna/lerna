"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

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

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

// remove quotes around strings
expect.addSnapshotSerializer({
  print: val => val,
  test: val => typeof val === "string",
});

const setupChanges = async cwd => {
  await gitTag(cwd, "v1.0.1-beta.3");
  await fs.outputFile(path.join(cwd, "packages/package-3/hello.js"), "world");
  await gitAdd(cwd, ".");
  await gitCommit(cwd, "setup");
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
