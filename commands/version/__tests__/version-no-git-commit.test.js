"use strict";

jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

const path = require("path");

// helpers
const loggingOutput = require("@lerna-test/logging-output");
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const showCommit = require("@lerna-test/show-commit");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("--no-git-commit", () => {
  it("does not create a git commit", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--no-git-commit");

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain("Skipping commit");

    const commit = await showCommit(testDir);
    expect(commit).not.toBe("v1.0.1");
  });

  it("tags the release", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--no-git-commit");

    const logMessages = loggingOutput("info");
    expect(logMessages).not.toContain("Skipping tag");

    const commit = await showCommit(testDir);
    expect(commit).toContain("tag:");
  });
});
