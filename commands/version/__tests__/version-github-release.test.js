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
const { client } = require("@lerna/github-client");
const { recommendVersion } = require("@lerna/conventional-commits");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

test("--github-release does not create a release if --no-push is passed", async () => {
  const cwd = await initFixture("independent");

  await lernaVersion(cwd)("--github-release", "--conventional-commits", "--no-push");

  expect(client.repos.createRelease).not.toHaveBeenCalled();
});

test("--github-release throws an error if --conventional-commits is not passed", async () => {
  const cwd = await initFixture("independent");

  try {
    await lernaVersion(cwd)("--github-release");
  } catch (err) {
    expect(err.message).toBe("To create a Github Release, you must enable --conventional-commits");
    expect(client.repos.createRelease).not.toHaveBeenCalled();
  }

  expect.hasAssertions();
});

test("--github-release marks a version as a pre-release if it contains a valid part", async () => {
  const cwd = await initFixture("normal");

  recommendVersion.mockResolvedValueOnce("2.0.0-alpha.1");

  await lernaVersion(cwd)("--github-release", "--conventional-commits");

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

test("--github-release creates a release for every independent version", async () => {
  const cwd = await initFixture("independent");
  const versionBumps = new Map([
    ["package-1", "1.0.1"],
    ["package-2", "2.1.0"],
    ["package-3", "4.0.0"],
    ["package-4", "4.1.0"],
    ["package-5", "5.0.1"],
  ]);

  versionBumps.forEach(bump => recommendVersion.mockResolvedValueOnce(bump));

  await lernaVersion(cwd)("--github-release", "--conventional-commits");

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

test("--github-release creates a single fixed release", async () => {
  const cwd = await initFixture("normal");

  recommendVersion.mockResolvedValueOnce("1.1.0");

  await lernaVersion(cwd)("--github-release", "--conventional-commits");

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
