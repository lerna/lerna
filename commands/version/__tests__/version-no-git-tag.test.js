"use strict";

jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

const path = require("path");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const getCommitMessage = require("@lerna-test/get-commit-message");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("--no-git-tag", () => {
  it("does not create a git tag", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--no-git-tag");

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain("Skipping tags");

    const commit = await getCommitMessage(testDir);
    expect(commit).not.toContain("tag:");
  });

  it("creates a release commit", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--no-git-tag");

    const logMessages = loggingOutput("info");
    expect(logMessages).not.toContain("Skipping commit");

    const commit = await getCommitMessage(testDir);
    expect(commit).toBe("v1.0.1");
  });
});
