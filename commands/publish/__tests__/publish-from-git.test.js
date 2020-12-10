"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/get-npm-username");
jest.mock("../lib/get-two-factor-auth-required");
jest.mock("../lib/get-unpublished-packages");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");
jest.mock("../../version/lib/remote-branch-exists");

// mocked or stubbed modules
const { npmPublish } = require("@lerna/npm-publish");
const { promptConfirmation } = require("@lerna/prompt");
const { output } = require("@lerna/output");
const { throwIfUncommitted } = require("@lerna/check-working-tree");

// helpers
const { loggingOutput } = require("@lerna-test/logging-output");
const { gitTag } = require("@lerna-test/git-tag");
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// file under test
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("publish from-git", () => {
  it("publishes tagged packages", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "v1.0.0");
    await lernaPublish(cwd)("from-git");

    // called from chained describeRef()
    expect(throwIfUncommitted).toHaveBeenCalled();

    expect(promptConfirmation).toHaveBeenLastCalledWith("Are you sure you want to publish these packages?");
    expect(output.logged()).toMatch("Found 4 packages to publish:");
    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("publishes tagged independent packages", async () => {
    const cwd = await initFixture("independent");

    await Promise.all([
      gitTag(cwd, "package-1@1.0.0"),
      gitTag(cwd, "package-2@2.0.0"),
      gitTag(cwd, "package-3@3.0.0"),
      gitTag(cwd, "package-4@4.0.0"),
      gitTag(cwd, "package-5@5.0.0"),
    ]);
    await lernaPublish(cwd)("from-git");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("publishes packages matching custom --tag-version-prefix", async () => {
    const cwd = await initFixture("normal");

    await gitTag(cwd, "foo/1.0.0");
    await lernaPublish(cwd)("from-git", "--tag-version-prefix", "foo/");

    expect(npmPublish.order()).toEqual([
      "package-1",
      "package-3",
      "package-4",
      "package-2",
      // package-5 is private
    ]);
  });

  it("only publishes independent packages with matching tags", async () => {
    const cwd = await initFixture("independent");

    await gitTag(cwd, "package-3@3.0.0");
    await lernaPublish(cwd)("from-git");

    expect(output.logged()).toMatch("Found 1 package to publish:");
    expect(npmPublish.order()).toEqual(["package-3"]);
  });

  it("exits early when the current commit is not tagged", async () => {
    const cwd = await initFixture("normal");

    await lernaPublish(cwd)("from-git");

    expect(npmPublish).not.toHaveBeenCalled();

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain("No tagged release found");
  });

  it("throws an error when uncommitted changes are present", async () => {
    throwIfUncommitted.mockImplementationOnce(() => {
      throw new Error("uncommitted");
    });

    const cwd = await initFixture("normal");
    const command = lernaPublish(cwd)("from-git");

    await expect(command).rejects.toThrow("uncommitted");
    // notably different than the actual message, but good enough here
  });

  it("throws an error when --git-head is passed", async () => {
    const cwd = await initFixture("normal");
    const command = lernaPublish(cwd)("from-git", "--git-head", "deadbeef");

    await expect(command).rejects.toThrow(
      expect.objectContaining({
        prefix: "EGITHEAD",
      })
    );
  });
});
