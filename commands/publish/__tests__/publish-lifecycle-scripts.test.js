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
const runLifecycle = require("@lerna/run-lifecycle");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("lifecycle scripts", () => {
  it("calls publish lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)();

    ["prepare", "prepublishOnly", "prepack", "postpack", "postpublish"].forEach(script => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(expect.objectContaining({ name: "lifecycle" }), script);
    });

    // all leaf package lifecycles _EXCEPT_ prepublishOnly & postpublish are called by npm pack
    expect(runLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-1" }),
      expect.stringMatching("prepare")
    );
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-1" }),
      expect.stringMatching("prepublishOnly")
    );
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-1" }),
      expect.stringMatching("postpublish")
    );

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
      ["lifecycle", "prepack"],
      ["package-1", "prepublishOnly"],
      ["lifecycle", "postpack"],
      ["package-1", "postpublish"],
      ["lifecycle", "postpublish"],
    ]);
  });
});
