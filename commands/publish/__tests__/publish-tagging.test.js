"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

// mocked modules
const collectUpdates = require("@lerna/collect-updates");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

test("publish --npm-tag", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-3");

  await lernaPublish(cwd)("--npm-tag", "custom");

  expect(npmPublish.registry.size).toBe(1);
  expect(npmPublish.registry.get("package-3").tag).toBe("custom");
});

test("publish --temp-tag", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-4");

  await lernaPublish(cwd)("--temp-tag", "--registry", "test-registry");

  expect(npmPublish.registry.size).toBe(1);
  expect(npmPublish.registry.get("package-4").tag).toBe("lerna-temp");

  expect(npmDistTag.remove).lastCalledWith(
    expect.objectContaining({ name: "package-4" }),
    "lerna-temp",
    "test-registry"
  );
  expect(npmDistTag.add).lastCalledWith(
    expect.objectContaining({ name: "package-4" }),
    "1.0.1",
    "latest",
    "test-registry"
  );
});
