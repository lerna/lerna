"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

// mocked modules
const writePkg = require("write-pkg");
const npmPublish = require("@lerna/npm-publish");
const gitPush = require("../lib/git-push");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

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
