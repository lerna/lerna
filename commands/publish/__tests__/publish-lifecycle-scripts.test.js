"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");

const path = require("path");

// mocked modules
const writePkg = require("write-pkg");
const runLifecycle = require("@lerna/run-lifecycle");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");

// test command
const lernaPublish = require("@lerna-test/command-runner")(require("../command"));

describe("lifecycle scripts", () => {
  it("calls version and publish lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(12);

    ["preversion", "version", "postversion"].forEach(script => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "lifecycle" }),
        script,
        expect.any(Object) // conf
      );
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        script,
        expect.any(Object) // conf
      );
    });

    // package-2 lacks version lifecycle scripts
    expect(runLifecycle).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      expect.any(String),
      expect.any(Object) // conf
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

  it("logs lifecycle errors but preserves chain", async () => {
    const cwd = await initFixture("lifecycle");

    runLifecycle.mockImplementationOnce(() => Promise.reject(new Error("boom")));

    await lernaPublish(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(12);
    expect(writePkg.updatedVersions()).toEqual({
      "package-1": "1.0.1",
      "package-2": "1.0.1",
    });

    const [errorLog] = loggingOutput("error");
    expect(errorLog).toMatch("error running preversion in lifecycle");
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
        script,
        expect.any(Object) // conf
      );
    });
  });
});
