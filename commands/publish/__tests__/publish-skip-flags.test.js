"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-behind-upstream");

const execa = require("execa");

// mocked modules
const writePkg = require("write-pkg");
const PromptUtilities = require("@lerna/prompt");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const gitPush = require("../lib/git-push");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const getCommitMessage = require("@lerna-test/get-commit-message");
const loggingOutput = require("@lerna-test/logging-output");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const listDirty = cwd =>
  execa("git", ["diff", "--name-only"], { cwd }).then(result => result.stdout.split("\n").filter(Boolean));

// stabilize commit SHA
expect.addSnapshotSerializer(require("@lerna-test/serialize-git-sha"));

test("publish --skip-git", async () => {
  const cwd = await initFixture("normal");

  await lernaPublish(cwd)("--skip-git");

  expect(writePkg.updatedManifest("package-1")).toEqual({
    name: "package-1",
    version: "1.0.1",
    gitHead: expect.stringMatching(/^[0-9a-f]{40}$/),
  });
  expect(Array.from(npmPublish.registry.keys())).toEqual([
    "package-1",
    "package-3",
    "package-4",
    "package-2",
  ]);

  const unstaged = await listDirty(cwd);
  // FIXME: lerna.json should not have unstaged changes
  expect(unstaged).toEqual(["lerna.json"]);

  const logMessages = loggingOutput("info");
  expect(logMessages).toContain("Skipping git commit/push");
});

test("publish --skip-npm", async () => {
  const cwd = await initFixture("normal");

  await lernaPublish(cwd)("--skip-npm");

  expect(npmPublish).not.toBeCalled();
  expect(writePkg.updatedManifest("package-1")).toEqual({
    name: "package-1",
    version: "1.0.1",
    // gitHead not annotated
  });

  expect(gitPush).lastCalledWith(
    "origin",
    "master",
    expect.objectContaining({
      cwd,
    })
  );

  const logMessages = loggingOutput("info");
  expect(logMessages).toContain("Skipping publish to registry");
});

test("publish --skip-git --skip-npm", async () => {
  const cwd = await initFixture("normal");

  await lernaPublish(cwd)("--skip-git", "--skip-npm");

  expect(writePkg.updatedVersions()).toEqual({
    "package-1": "1.0.1",
    "package-2": "1.0.1",
    "package-3": "1.0.1",
    "package-4": "1.0.1",
    "package-5": "1.0.1",
  });

  expect(writePkg.updatedManifest("package-2").dependencies).toMatchObject({
    "package-1": "^1.0.1",
  });
  expect(writePkg.updatedManifest("package-3").devDependencies).toMatchObject({
    "package-2": "^1.0.1",
  });
  expect(writePkg.updatedManifest("package-4").dependencies).toMatchObject({
    "package-1": "^0.0.0",
  });
  expect(writePkg.updatedManifest("package-5").dependencies).toMatchObject({
    "package-1": "^1.0.1",
  });

  expect(gitPush).not.toBeCalled();

  const unstaged = await listDirty(cwd);
  expect(unstaged).not.toEqual([]);

  expect(npmPublish).not.toBeCalled();
  expect(npmDistTag.check).not.toBeCalled();
  expect(npmDistTag.remove).not.toBeCalled();
  expect(npmDistTag.add).not.toBeCalled();

  const logMessages = loggingOutput("info");
  expect(logMessages).toContain("Skipping git commit/push");
  expect(logMessages).toContain("Skipping publish to registry");
});

test("publish --yes", async () => {
  const cwd = await initFixture("normal");

  await lernaPublish(cwd)("--yes", "--repo-version", "1.0.1-auto-confirm");

  expect(PromptUtilities.select).not.toBeCalled();
  expect(PromptUtilities.confirm).not.toBeCalled();

  const message = await getCommitMessage(cwd);
  expect(message).toBe("v1.0.1-auto-confirm");
});
