"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const npmPublish = require("@lerna/npm-publish");
const PromptUtilities = require("@lerna/prompt");
const checkWorkingTree = require("@lerna/check-working-tree");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitTag = require("@lerna-test/git-tag");
const gitCommit = require("@lerna-test/git-commit");
const loggingOutput = require("@lerna-test/logging-output");

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

  expect(PromptUtilities.confirm).lastCalledWith("Are you sure you want to publish these packages?");
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

test("publish --canary addresses unpublished package", async () => {
  const cwd = await initTaggedFixture("independent");

  await setupChanges(
    cwd,
    [
      "packages/package-6/package.json",
      JSON.stringify({
        name: "package-6",
        // npm init starts at 1.0.0,
        // but an unpublished 1.0.0 should be 1.0.0-alpha.0, n'est-ce pas?
        version: "0.1.0",
      }),
    ],
    ["packages/package-6/new-kids.js", "on the block"]
  );
  await lernaPublish(cwd)("--canary", "premajor");

  // there have been two commits since the beginning of the repo
  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-6": 1.0.0-alpha.1+SHA,
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

test("publish --canary on tagged release exits early", async () => {
  const cwd = await initTaggedFixture("normal");

  await lernaPublish(cwd)("--canary");

  const logMessages = loggingOutput("success");
  expect(logMessages).toContain("Current HEAD is already released, skipping change detection.");
  expect(logMessages).toContain("No changed packages to publish");
});

test("publish --canary --force-publish on tagged release avoids early exit", async () => {
  const cwd = await initTaggedFixture("normal");

  await lernaPublish(cwd)("--canary", "--force-publish");

  const logMessages = loggingOutput("warn");
  expect(logMessages).toContain("all packages");
  // lerna WARN force-publish all packages

  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-1": 1.0.1-alpha.0+SHA,
  "package-2": 1.0.1-alpha.0+SHA,
  "package-3": 1.0.1-alpha.0+SHA,
  "package-4": 1.0.1-alpha.0+SHA,
}
`);
});

test("publish --canary --force-publish <arg> on tagged release avoids early exit", async () => {
  const cwd = await initTaggedFixture("independent");

  // canary committish needs to have a parent, but still tagged on same revision
  await setupChanges(cwd, ["packages/package-5/arbitrary.js", "change"]);
  await gitTag(cwd, "package-5@5.0.1");

  // there are no _actual_ changes to package-2 or any of its dependencies
  await lernaPublish(cwd)("--canary", "--force-publish", "package-2");

  const logMessages = loggingOutput("warn");
  expect(logMessages).toContain("package-2");
  // lerna WARN force-publish package-2

  expect(writePkg.updatedVersions()).toMatchInlineSnapshot(`
Object {
  "package-2": 2.0.1-alpha.0+SHA,
  "package-3": 3.0.1-alpha.0+SHA,
}
`);
});

test("publish --canary with dirty tree throws error", async () => {
  checkWorkingTree.throwIfUncommitted.mockImplementationOnce(() => {
    throw new Error("uncommitted");
  });

  const cwd = await initTaggedFixture("normal");

  try {
    await lernaPublish(cwd)("--canary");
  } catch (err) {
    expect(err.message).toBe("uncommitted");
    // notably different than the actual message, but good enough here
  }

  expect.assertions(1);
});
