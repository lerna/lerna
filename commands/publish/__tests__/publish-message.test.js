"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getCommitMessage = require("@lerna-test/get-commit-message");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

test("publish --message %s", async () => {
  const cwd = await initFixture("normal");
  await lernaPublish(cwd)("--message", "chore: Release %s :rocket:");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Release v1.0.1 :rocket:");
});

test("publish --message %v", async () => {
  const cwd = await initFixture("normal");
  await lernaPublish(cwd)("--message", "chore: Version %v without prefix");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Version 1.0.1 without prefix");
});

test("publish --message --independent", async () => {
  const cwd = await initFixture("independent");
  await lernaPublish(cwd)("--message", "chore: Custom publish message subject");

  const message = await getCommitMessage(cwd);
  expect(message).toMatch("chore: Custom publish message subject");
});
