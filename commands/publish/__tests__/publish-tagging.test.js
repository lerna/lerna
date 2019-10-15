"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
jest.mock("../lib/get-two-factor-auth-required");
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

  expect(npmDistTag.add.tagged()).toEqual(["next"]);
});

test("publish --dist-tag nightly --canary", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-2");

  await lernaPublish(cwd)("--dist-tag", "nightly", "--canary");

  expect(npmDistTag.add.tagged()).toEqual(["nightly"]);
});

test("publish --npm-tag deprecated", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-3");

  await lernaPublish(cwd)("--npm-tag", "deprecated");

  expect(npmDistTag.add.tagged()).toEqual(["deprecated"]);
});

test("publish (reads pkg.publishConfig.tag default)", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)();

  expect(npmPublish.registry).toMatchInlineSnapshot(`
    Map {
      "@integration/package-1" => "lerna-temp",
      "@integration/package-2" => "lerna-temp",
    }
  `);
  expect(npmDistTag.add.registry).toMatchInlineSnapshot(`
    Map {
      "@integration/package-1@1.0.1" => "CUSTOM",
      "@integration/package-2@1.0.1" => "latest",
    }
  `);
});

test("publish --dist-tag omega (overrides pkg.publishConfig.tag)", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)("--dist-tag", "omega");

  expect(npmDistTag.add.registry).toMatchInlineSnapshot(`
    Map {
      "@integration/package-1@1.0.1" => "omega",
      "@integration/package-2@1.0.1" => "omega",
    }
  `);
});

test("publish prerelease --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("prerelease", "--pre-dist-tag", "beta");

  expect(npmPublish.registry).toMatchInlineSnapshot(`
    Map {
      "package-1" => "lerna-temp",
    }
  `);
  expect(npmDistTag.add.registry).toMatchInlineSnapshot(`
    Map {
      "package-1@1.0.1-alpha.0" => "beta",
    }
  `);
});

test("publish non-prerelease --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("--pre-dist-tag", "beta");

  expect(npmDistTag.add.registry).toMatchInlineSnapshot(`
    Map {
      "package-1@1.0.1" => "latest",
    }
  `);
});

test("publish non-prerelease --dist-tag next --pre-dist-tag beta", async () => {
  const cwd = await initFixture("normal");

  collectUpdates.setUpdated(cwd, "package-1");

  await lernaPublish(cwd)("--dist-tag", "next", "--pre-dist-tag", "beta");

  expect(npmDistTag.add.registry).toMatchInlineSnapshot(`
    Map {
      "package-1@1.0.1" => "next",
    }
  `);
});

test("publish --pre-dist-tag beta --no-temp-tag", async () => {
  const cwd = await initFixture("integration");

  await lernaPublish(cwd)(
    "prerelease",
    "--dist-tag",
    "next",
    "--preid",
    "beta",
    "--pre-dist-tag",
    "beta",
    "--no-temp-tag"
  );

  expect(npmDistTag.add).not.toHaveBeenCalled();
  expect(npmPublish.registry).toMatchInlineSnapshot(`
    Map {
      "@integration/package-1" => "beta",
      "@integration/package-2" => "beta",
    }
  `);
});
