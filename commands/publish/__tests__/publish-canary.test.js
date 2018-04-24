"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const npmPublish = require("@lerna/npm-publish");

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

test("publish --canary", async () => {
  const cwd = await initTaggedFixture("normal");

  await setupChanges(
    cwd,
    ["packages/package-1/all-your-base.js", "belong to us"],
    ["packages/package-4/non-matching-semver.js", "senpai noticed me"]
  );
  await lernaPublish(cwd)("--canary");

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
});

test("publish --canary --preid beta", async () => {
  const cwd = await initTaggedFixture("normal");

  await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
  await lernaPublish(cwd)("--canary", "--preid", "beta");

  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-beta.0+SHA,
  "package-2": 1.0.1-beta.0+SHA,
  "package-3": 1.0.1-beta.0+SHA,
}
`);
});

test("publish --canary <semver>", async () => {
  const cwd = await initTaggedFixture("normal");

  await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
  await lernaPublish(cwd)("--canary", "prerelease");
  // prerelease === prepatch, which is the default

  expect(npmPublish.registry).toMatchInlineSnapshot(`
Map {
  "package-1" => "canary",
  "package-3" => "canary",
  "package-2" => "canary",
}
`);
  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-alpha.0+SHA,
  "package-2": 1.0.1-alpha.0+SHA,
  "package-3": 1.0.1-alpha.0+SHA,
}
`);
});

test("publish --canary --independent", async () => {
  const cwd = await initTaggedFixture("independent");

  await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
  await lernaPublish(cwd)("--canary", "preminor");

  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.1.0-alpha.0+SHA,
  "package-2": 2.1.0-alpha.0+SHA,
  "package-3": 3.1.0-alpha.0+SHA,
}
`);
});

describe("publish --canary differential", () => {
  test("source", async () => {
    const cwd = await initTaggedFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
    await lernaPublish(cwd)("--canary", "patch");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-alpha.0+SHA,
  "package-2": 1.0.1-alpha.0+SHA,
  "package-3": 1.0.1-alpha.0+SHA,
  "package-4": 1.0.1-alpha.0+SHA,
  "package-5": 1.0.1-alpha.0+SHA,
}
`);
  });

  test("internal", async () => {
    const cwd = await initTaggedFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-3/malcolm.js", "in the middle"]);
    await lernaPublish(cwd)("--canary", "minor");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-3": 1.1.0-alpha.0+SHA,
  "package-4": 1.1.0-alpha.0+SHA,
  "package-5": 1.1.0-alpha.0+SHA,
}
`);
  });

  test("pendant", async () => {
    const cwd = await initTaggedFixture("snake-graph");

    await setupChanges(cwd, ["packages/package-5/celine-dion.js", "all by myself"]);
    await lernaPublish(cwd)("--canary", "major");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-5": 2.0.0-alpha.0+SHA,
}
`);
  });
});

describe("publish --canary sequential", () => {
  let cwd;

  beforeAll(async () => {
    cwd = await initTaggedFixture("snake-independent");
  });

  test("1. pendant", async () => {
    await setupChanges(cwd, ["packages/package-5/celine-dion.js", "all by myself"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-5": 5.0.1-alpha.0+SHA,
}
`);
  });

  test("2. internal", async () => {
    await setupChanges(cwd, ["packages/package-3/malcolm.js", "in the middle"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-3": 3.0.1-alpha.1+SHA,
  "package-4": 4.0.1-alpha.1+SHA,
  "package-5": 5.0.1-alpha.1+SHA,
}
`);
  });

  test("3. source", async () => {
    await setupChanges(cwd, ["packages/package-1/all-your-base.js", "belong to us"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-alpha.2+SHA,
  "package-2": 2.0.1-alpha.2+SHA,
  "package-3": 3.0.1-alpha.2+SHA,
  "package-4": 4.0.1-alpha.2+SHA,
  "package-5": 5.0.1-alpha.2+SHA,
}
`);
  });

  test("4. internal", async () => {
    await setupChanges(cwd, ["packages/package-3/malcolm.js", "tucker"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-3": 3.0.1-alpha.3+SHA,
  "package-4": 4.0.1-alpha.3+SHA,
  "package-5": 5.0.1-alpha.3+SHA,
}
`);
  });

  test("5. pendant", async () => {
    await setupChanges(cwd, ["packages/package-5/celine-dion.js", "my heart will go on"]);
    await lernaPublish(cwd)("--canary");

    expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-5": 5.0.1-alpha.4+SHA,
}
`);
  });
});
