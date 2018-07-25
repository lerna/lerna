"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/get-packages-without-license");
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");

// mocked modules
const runLifecycle = require("@lerna/run-lifecycle");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("lifecycle scripts", () => {
  it("calls version and publish lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(12);

    ["preversion", "version", "postversion"].forEach(script => {
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
      ["lifecycle", "preversion"],
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle", "version"],
      ["package-1", "postversion"],
      ["lifecycle", "postversion"],
      ["lifecycle", "prepare"],
      ["lifecycle", "prepublishOnly"],
      ["package-1", "prepare"],
      ["package-1", "prepublishOnly"],
      ["package-1", "postpublish"],
      ["lifecycle", "postpublish"],
    ]);
  });

  it("defaults missing root package name", async () => {
    const cwd = await initFixture("lifecycle-no-root-name");

    await lernaPublish(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(6);

    ["preversion", "version", "postversion"].forEach(script => {
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({
          // defaulted from dirname, like npm init
          name: path.basename(cwd),
        }),
        script
      );
    });
  });
});
