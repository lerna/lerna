"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

const path = require("path");

// mocked modules
const { client } = require("@lerna/github-client");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");

// helpers
const initFixture = require("@lerna-test/init-fixture")(path.resolve(__dirname, "../../publish/__tests__"));

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("--github-release", () => {
  it("should NOT create a release if --no-push is passed", async () => {
    const cwd = await initFixture("independent");

    await lernaVersion(cwd)("--github-release", "--no-push");

    expect(client.repos.createRelease).not.toHaveBeenCalled();
  });

  it("should NOT create a release if --conventional-commits is not passed", async () => {
    const cwd = await initFixture("independent");

    await lernaVersion(cwd)("--github-release", "--push");

    expect(client.repos.createRelease).not.toHaveBeenCalled();
  });

  it("should correctly mark a version as a pre-release if it contains a valid part", async () => {
    ConventionalCommitUtilities.mockBumps("1.0.0", "2.0.0-alpha.1");

    const cwd = await initFixture("normal");

    await lernaVersion(cwd)("--github-release", "--push", "--conventional-commits");

    expect(client.repos.createRelease).toHaveBeenCalledTimes(1);
    expect(client.repos.createRelease).toHaveBeenCalledWith({
      owner: "lerna",
      repo: "lerna",
      tag_name: "v2.0.0-alpha.1",
      name: "v2.0.0-alpha.1",
      body: "normal",
      draft: false,
      prerelease: true,
    });
  });

  describe("independent", () => {
    const versionBumps = new Map([
      ["package-1", "1.0.1"],
      ["package-2", "2.1.0"],
      ["package-3", "4.0.0"],
      ["package-4", "4.1.0"],
      ["package-5", "5.0.1"],
    ]);

    beforeEach(() => {
      ConventionalCommitUtilities.mockBumps(...versionBumps.values());
    });

    it("should create a release for every package version", async () => {
      const cwd = await initFixture("independent");

      await lernaVersion(cwd)("--github-release", "--push", "--conventional-commits");

      expect(client.repos.createRelease).toHaveBeenCalledTimes(5);

      versionBumps.forEach((version, name) => {
        expect(client.repos.createRelease).toHaveBeenCalledWith({
          owner: "lerna",
          repo: "lerna",
          tag_name: `${name}@${version}`,
          name: `${name}@${version}`,
          body: `${name} - ${version}`,
          draft: false,
          prerelease: false,
        });
      });
    });
  });

  describe("fixed", () => {
    beforeEach(() => {
      ConventionalCommitUtilities.mockBumps("1.0.1", "1.1.0", "2.0.0", "1.1.0", "1.0.0");
    });

    it("should create a single release", async () => {
      const cwd = await initFixture("normal");

      await lernaVersion(cwd)("--github-release", "--push", "--conventional-commits");

      expect(client.repos.createRelease).toHaveBeenCalledTimes(1);

      expect(client.repos.createRelease).toHaveBeenCalledWith({
        owner: "lerna",
        repo: "lerna",
        tag_name: "v2.0.0",
        name: "v2.0.0",
        body: "normal",
        draft: false,
        prerelease: false,
      });
    });
  });
});
