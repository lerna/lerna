"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

// mocked modules
const PromptUtilities = require("@lerna/prompt");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getCommitMessage = require("@lerna-test/get-commit-message");
const showCommit = require("@lerna-test/show-commit");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("publish --cd-version", () => {
  it("increments published version by semver keyword", async () => {
    const testDir = await initFixture("normal");

    await lernaPublish(testDir)("--cd-version", "minor");

    expect(PromptUtilities.select).not.toBeCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.1.0");
  });

  it("throws an error when an invalid semver keyword is used", async () => {
    expect.assertions(1);

    const testDir = await initFixture("normal");

    try {
      await lernaPublish(testDir)("--cd-version", "poopypants");
    } catch (err) {
      expect(err.message).toBe(
        "--cd-version must be one of: " +
          "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
      );
    }
  });
});

describe("publish --cd-version --independent", () => {
  it("increments published versions by semver keyword", async () => {
    const testDir = await initFixture("independent");

    await lernaPublish(testDir)("--cd-version", "patch");

    expect(PromptUtilities.select).not.toBeCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toMatchSnapshot();
  });

  it("bumps prerelease version with --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaPublish(testDir)("--cd-version", "prerelease", "--preid", "foo");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  it("bumps prerelease with default --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaPublish(testDir)("--cd-version", "prerelease");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});
