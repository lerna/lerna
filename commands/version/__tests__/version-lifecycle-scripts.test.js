"use strict";

// local modules _must_ be explicitly mocked
jest.mock("../lib/git-push");
jest.mock("../lib/is-anything-committed");
jest.mock("../lib/is-behind-upstream");
jest.mock("../lib/remote-branch-exists");

// mocked modules
const runLifecycle = require("@lerna/run-lifecycle");
const loadJsonFile = require("load-json-file");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);

// test command
const lernaVersion = require("@lerna-test/command-runner")(require("../command"));

describe("lifecycle scripts", () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
  });

  it("calls version lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaVersion(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(6);

    ["preversion", "version", "postversion"].forEach(script => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "lifecycle" }),
        script,
        expect.any(Object)
      );
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "package-1" }),
        script,
        expect.any(Object)
      );
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
    ]);

    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual([
      "/packages/package-1",
      "/packages/package-2",
    ]);
  });

  it("does not execute recursive root scripts", async () => {
    const cwd = await initFixture("lifecycle");

    process.env.npm_lifecycle_event = "version";

    await lernaVersion(cwd)();

    expect(runLifecycle.getOrderedCalls()).toEqual([
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["package-1", "postversion"],
    ]);
  });

  it("does not duplicate rooted leaf scripts", async () => {
    const cwd = await initFixture("lifecycle-rooted-leaf");

    await lernaVersion(cwd)();

    expect(runLifecycle.getOrderedCalls()).toEqual([
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle-rooted-leaf", "preversion"],
      ["lifecycle-rooted-leaf", "version"],
      ["lifecycle-rooted-leaf", "postversion"],
      ["package-1", "postversion"],
    ]);
  });

  it("respects --ignore-scripts", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaVersion(cwd)("--ignore-scripts");

    // despite all the scripts being passed to runLifecycle()
    // none of them will actually execute as long as opts["ignore-scripts"] is provided
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "lifecycle" }),
      "version",
      expect.objectContaining({
        "ignore-scripts": true,
      })
    );
  });
});
