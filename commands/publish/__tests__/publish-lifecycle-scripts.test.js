"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/verify-npm-package-access");
jest.mock("../lib/verify-npm-registry");
// FIXME: better mock for version command
jest.mock("../../version/lib/git-push");
jest.mock("../../version/lib/is-anything-committed");
jest.mock("../../version/lib/is-behind-upstream");

// mocked modules
const runLifecycle = require("@lerna/run-lifecycle");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("lifecycle scripts", () => {
  it("calls publish lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(12);

    ["prepare", "prepublishOnly", "postpublish"].forEach(script => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: "lifecycle" }), script);
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: "package-1" }), script);
    });

    // package-2 lacks version lifecycle scripts
    expect(runLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      expect.any(String)
    );

    expect(runLifecycle.getOrderedCalls()).toEqual([
      // TODO: separate from VersionCommand details
      ["lifecycle", "preversion"],
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle", "version"],
      ["package-1", "postversion"],
      ["lifecycle", "postversion"],
      // publish-specific
      ["lifecycle", "prepare"],
      ["lifecycle", "prepublishOnly"],
      ["package-1", "prepare"],
      ["package-1", "prepublishOnly"],
      ["package-1", "postpublish"],
      ["lifecycle", "postpublish"],
    ]);
  });
});
