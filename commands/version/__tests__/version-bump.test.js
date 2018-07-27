"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");

// mocked modules
const PromptUtilities = require("@lerna/prompt");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));
const getCommitMessage = require("@lerna-test/get-commit-message");
const showCommit = require("@lerna-test/show-commit");

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

describe("version bump", () => {
  it("accepts explicit versions", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("1.0.1-beta.25");

    expect(PromptUtilities.select).not.toBeCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  it("receives --repo-version <value> as explicit [bump]", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--repo-version", "1.0.1-beta.25");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.0.1-beta.25");
  });

  it("errors when --repo-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");

    try {
      await lernaVersion(testDir)("v1.0.1-beta.25", "--repo-version", "v1.0.1-beta.25");
    } catch (err) {
      expect(err.message).toBe("Arguments repo-version and bump are mutually exclusive");
    }

    expect.assertions(1);
  });

  it("strips invalid semver information from explicit value", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("v1.2.0-beta.1+deadbeef");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.2.0-beta.1");
  });

  it("accepts semver keywords", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("minor");

    expect(PromptUtilities.select).not.toBeCalled();

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v1.1.0");
  });

  it("receives --cd-version <bump>", async () => {
    const testDir = await initFixture("normal");
    await lernaVersion(testDir)("--cd-version", "premajor");

    const message = await getCommitMessage(testDir);
    expect(message).toBe("v2.0.0-alpha.0");
  });

  it("errors when --cd-version and [bump] positional passed", async () => {
    const testDir = await initFixture("normal");

    try {
      await lernaVersion(testDir)("minor", "--cd-version", "minor");
    } catch (err) {
      expect(err.message).toBe("Arguments cd-version and bump are mutually exclusive");
    }

    expect.assertions(1);
  });

  it("throws an error when an invalid semver keyword is used", async () => {
    const testDir = await initFixture("normal");

    try {
      await lernaVersion(testDir)("poopypants");
    } catch (err) {
      expect(err.message).toBe(
        "bump must be an explicit version string _or_ one of: " +
          "'major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', or 'prerelease'."
      );
    }

    expect.assertions(1);
  });

  test("prerelease increments version with default --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaVersion(testDir)("prerelease");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });

  test("prerelease increments version with custom --preid", async () => {
    const testDir = await initFixture("independent");

    await lernaVersion(testDir)("prerelease", "--preid", "foo");

    const patch = await showCommit(testDir);
    expect(patch).toMatchSnapshot();
  });
});
