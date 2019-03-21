"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");
jest.mock("../../version/lib/remote-branch-exists");

// mocked modules
const collectUpdates = require("@lerna/collect-updates");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

test("publish --dist-tag next", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("--dist-tag", "next");

  expect(npmPublish.registry.get("package-1")).toBe("next");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish --dist-tag nightly --canary", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-2");

  await lernaPublish(cwd)("--dist-tag", "nightly", "--canary");

  expect(npmPublish.registry.get("package-2")).toBe("nightly");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish --npm-tag deprecated", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-3");

  await lernaPublish(cwd)("--npm-tag", "deprecated");

  expect(npmPublish.registry.get("package-3")).toBe("deprecated");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish --temp-tag", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)("--temp-tag");

  expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: "latest",
  });

  expect(npmDistTag.remove).toHaveBeenCalledWith("@integration/package-1@1.0.1", "lerna-temp", conf);
  expect(npmDistTag.remove).toHaveBeenCalledWith("@integration/package-2@1.0.1", "lerna-temp", conf);

  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1", "CUSTOM", conf); // <--
  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1", "latest", conf);
});

test("publish --dist-tag beta --temp-tag", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)("--dist-tag", "beta", "--temp-tag");

  expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: "beta",
  });

  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1", "beta", conf); // <--
  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1", "beta", conf);
});

test("publish prerelease --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("prerelease", "--pre-dist-tag", "beta");

  expect(npmPublish.registry.get("package-1")).toBe("beta");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish non-prerelease --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("--pre-dist-tag", "beta");

  expect(npmPublish.registry.get("package-1")).toBe("latest");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish non-prerelease --dist-tag next --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("--dist-tag", "next", "--pre-dist-tag", "beta");

  expect(npmPublish.registry.get("package-1")).toBe("next");
  expect(npmDistTag.remove).not.toHaveBeenCalled();
});

test("publish --pre-dist-tag beta --temp-tag", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)("prerelease", "--preid", "beta", "--pre-dist-tag", "beta", "--temp-tag");

  expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "@integration/package-1" => "lerna-temp",
  "@integration/package-2" => "lerna-temp",
}
`);

  const conf = expect.objectContaining({
    tag: "beta",
  });

  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-1@1.0.1-beta.0", "beta", conf); // <--
  expect(npmDistTag.add).toHaveBeenCalledWith("@integration/package-2@1.0.1-beta.0", "beta", conf);
});
