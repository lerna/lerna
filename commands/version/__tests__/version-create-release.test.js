"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-add");
jest.mock("../lib/git-commit");
jest.mock("../lib/git-push");
jest.mock("../lib/git-tag");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

// mocked modules
const githubClient = require("@lerna/github-client").client;
const gitlabClient = require("@lerna/gitlab-client")();
const { recommendVersion } = require("@lerna/conventional-commits");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe.each([
  ["github", githubClient],
  ["gitlab", gitlabClient],
])("--create-release %s", (type, client) => {
  it("does not create a release if --no-push is passed", async () => {
    const cwd = await initFixture("independent");

    await lernaVersion(cwd)("--create-release", type, "--conventional-commits", "--no-push");

    expect(client.repos.createRelease).not.toHaveBeenCalled();
  });

  it("throws an error if --conventional-commits is not passed", async () => {
    const cwd = await initFixture("independent");
    const command = lernaVersion(cwd)("--create-release", type);

    await expect(command).rejects.toThrow("To create a release, you must enable --conventional-commits");

    expect(client.repos.createRelease).not.toHaveBeenCalled();
  });

  it("throws an error if --no-changelog also passed", async () => {
    const cwd = await initFixture("independent");
    const command = lernaVersion(cwd)("--create-release", type, "--conventional-commits", "--no-changelog");

    await expect(command).rejects.toThrow("To create a release, you cannot pass --no-changelog");

    expect(client.repos.createRelease).not.toHaveBeenCalled();
  });

  it("marks a version as a pre-release if it contains a valid part", async () => {
    const cwd = await initFixture("normal");

    recommendVersion.mockResolvedValueOnce("2.0.0-alpha.1");

    await lernaVersion(cwd)("--create-release", type, "--conventional-commits");

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

  it("creates a release for every independent version", async () => {
    const cwd = await initFixture("independent");
    const versionBumps = new Map([
      ["package-1", "1.0.1"],
      ["package-2", "2.1.0"],
      ["package-3", "4.0.0"],
      ["package-4", "4.1.0"],
      ["package-5", "5.0.1"],
    ]);

    versionBumps.forEach(bump => recommendVersion.mockResolvedValueOnce(bump));

    await lernaVersion(cwd)("--create-release", type, "--conventional-commits");

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

  it("creates a single fixed release", async () => {
    const cwd = await initFixture("normal");

    recommendVersion.mockResolvedValueOnce("1.1.0");

    await lernaVersion(cwd)("--create-release", type, "--conventional-commits");

    expect(client.repos.createRelease).toHaveBeenCalledTimes(1);
    expect(client.repos.createRelease).toHaveBeenCalledWith({
      owner: "lerna",
      repo: "lerna",
      tag_name: "v1.1.0",
      name: "v1.1.0",
      body: "normal",
      draft: false,
      prerelease: false,
    });
  });
});

describe("legacy option --github-release", () => {
  it("is translated into --create-release=github", async () => {
    const cwd = await initFixture("normal");

    await lernaVersion(cwd)("--github-release", "--conventional-commits");

    expect(githubClient.repos.createRelease).toHaveBeenCalled();
  });
});

describe("--create-release [unrecognized]", () => {
  it("throws an error", async () => {
    const cwd = await initFixture("normal");
    const command = lernaVersion(cwd)("--conventional-commits", "--create-release", "poopypants");

    await expect(command).rejects.toThrow("create-release");

    expect(githubClient.repos.createRelease).not.toHaveBeenCalled();
    expect(gitlabClient.repos.createRelease).not.toHaveBeenCalled();
  });
});
