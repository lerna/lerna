"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const npmPublish = require("@lerna/npm-publish");
const gitPush = require("../lib/git-push");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

test("publish --canary", async () => {
  const cwd = await initFixture("normal");
  await lernaPublish(cwd)("--canary");

  expect(gitPush).not.toBeCalled();
  expect(writePkg.registry).toMatchSnapshot("updated packages");
  expect(npmPublish.registry).toMatchSnapshot("npm published");
});

test("publish --canary=beta", async () => {
  const cwd = await initFixture("normal");
  await lernaPublish(cwd)("--canary", "beta");

  expect(writePkg.registry).toMatchSnapshot("updated packages");
});

test("publish --canary --cd-version=patch", async () => {
  const cwd = await initFixture("normal");
  await lernaPublish(cwd)("--canary", "--cd-version", "patch");

  expect(writePkg.registry).toMatchSnapshot("updated packages");
});

test("publish --canary --independent", async () => {
  const cwd = await initFixture("independent");
  await lernaPublish(cwd)("--canary");

  expect(writePkg.registry).toMatchSnapshot("updated packages");
  expect(npmPublish.registry).toMatchSnapshot("npm published");
});

describe("publish --canary differential", () => {
  async function setupChanges(cwd, ...tuples) {
    await gitTag(cwd, "v1.0.0");
    await Promise.all(
      tuples.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, "utf8"))
    );
    await gitAdd(cwd, ".");
    await gitCommit(cwd, "setup");
  }

  test("source", async () => {
    const cwd = await initFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.registry).toMatchSnapshot();
  });

  test("internal", async () => {
    const cwd = await initFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-3/malcolm.js", "in the middle"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.registry).toMatchSnapshot();
  });

  test("pendant", async () => {
    const cwd = await initFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-5/celine-dion.js", "all by myself"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.registry).toMatchSnapshot();
  });
});
