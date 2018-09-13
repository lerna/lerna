"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");

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

  expect(npmPublish.registry.get("package-3")).toBe("custom");
  expect(npmDistTag.check).not.toBeCalled();
});

test("publish --temp-tag", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-4");

  await lernaPublish(cwd)("--temp-tag", "--registry", "test-registry");

  expect(npmPublish.registry.get("package-4")).toBe("lerna-temp");

  expect(npmDistTag.remove).lastCalledWith(
    expect.objectContaining({ name: "package-4" }),
    "lerna-temp",
    expect.objectContaining({ registry: "test-registry" })
  );
  expect(npmDistTag.add).lastCalledWith(
    expect.objectContaining({ name: "package-4", version: "1.0.1" }),
    "latest",
    expect.objectContaining({ registry: "test-registry" })
  );
});
