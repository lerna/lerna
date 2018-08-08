"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/get-two-factor-auth-required");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
jest.mock("../lib/git-checkout");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const npmPublish = require("@lerna/npm-publish");
const PromptUtilities = require("@lerna/prompt");
const gitCheckout = require("../lib/git-checkout");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

async function initTaggedFixture(fixtureName) {
  const cwd = await initFixture(fixtureName);

  if (fixtureName.indexOf("independent") > -1) {
    await Promise.all([
      gitTag(cwd, "package-1@1.0.0"),
      gitTag(cwd, "package-2@2.0.0"),
      gitTag(cwd, "package-3@3.0.0"),
      gitTag(cwd, "package-4@4.0.0"),
      gitTag(cwd, "package-5@5.0.0"),
    ]);
  } else {
    await gitTag(cwd, "v1.0.0");
  }

  return cwd;
}

/**
 * ALL canary tests _require_ an actual commit _past_ the original tag,
 * as a canary release on the same commit as a tagged release is non-sensical.
 *
 * @param {String} cwd Current working directory
 * @param {Array[String]..} tuples Any number of [filePath, fileContent] configs
 */
async function setupChanges(cwd, ...tuples) {
  await Promise.all(
    tuples.map(([filePath, content]) => fs.outputFile(path.join(cwd, filePath), content, "utf8"))
  );
  await gitAdd(cwd, ".");
  await gitCommit(cwd, "setup");
}

test("publish --canary --no-git-reset", async () => {
  const cwd = await initTaggedFixture("normal");

  await setupChanges(
    cwd,
    ["packages/package-1/all-your-base.js", "belong to us"],
    ["packages/package-4/non-matching-semver.js", "senpai noticed me"]
  );
  await lernaPublish(cwd)("--canary", "--no-git-reset");

  expect(PromptUtilities.confirm).toHaveBeenLastCalledWith(
    "Are you sure you want to publish these packages?"
  );
  expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "package-1" => "canary",
  "package-3" => "canary",
  "package-4" => "canary",
  "package-2" => "canary",
}
`);
  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-alpha.0+SHA,
  "package-2": 1.0.1-alpha.0+SHA,
  "package-3": 1.0.1-alpha.0+SHA,
  "package-4": 1.0.1-alpha.0+SHA,
}
`);
  expect(gitCheckout).toHaveBeenCalledTimes(0);
});
