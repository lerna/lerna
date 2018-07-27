"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const getCommitMessage = require("@lerna-test/get-commit-message");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

test("publish --message %s", async () => {
  const cwd = await initFixture("normal");
  await lernaVersion(cwd)("--message", "chore: Release %s :rocket:");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Release v1.0.1 :rocket:");
});

test("publish --message %v", async () => {
  const cwd = await initFixture("normal");
  await lernaVersion(cwd)("--message", "chore: Version %v without prefix");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Version 1.0.1 without prefix");
});

test("publish -m --independent", async () => {
  const cwd = await initFixture("independent");
  await lernaVersion(cwd)("-m", "chore: Custom publish message subject");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Custom publish message subject");
});
