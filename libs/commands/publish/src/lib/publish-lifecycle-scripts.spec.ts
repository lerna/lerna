import { packDirectory as _packDirectory, runLifecycle as _runLifecycle } from "@lerna/core";
import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import _loadJsonFile from "load-json-file";
import path from "path";
import { setupLernaVersionMocks } from "../../__fixtures__/lerna-version-mocks";

// eslint-disable-next-line jest/no-mocks-import
jest.mock("load-json-file", () => require("@lerna/test-helpers/__mocks__/load-json-file"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// lerna publish mocks
jest.mock("./get-packages-without-license", () => {
  return {
    getPackagesWithoutLicense: jest.fn().mockResolvedValue([]),
  };
});
jest.mock("./verify-npm-package-access");
jest.mock("./get-npm-username");
jest.mock("./get-two-factor-auth-required");

// lerna version mocks
setupLernaVersionMocks();

// The mock differs from the real thing
const loadJsonFile = _loadJsonFile as any;
const packDirectory = _packDirectory as any;
const runLifecycle = _runLifecycle as any;

const initFixture = initFixtureFactory(__dirname);

// test command
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaPublish = commandRunner(require("../command"));

describe("lifecycle scripts", () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
  });

  it("calls publish lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)();

    ["prepare", "prepublishOnly", "prepack", "postpack", "postpublish"].forEach((script) => {
      // "lifecycle" is the root manifest name
      expect(runLifecycle).toHaveBeenCalledWith(
        expect.objectContaining({ name: "lifecycle" }),
        script,
        expect.any(Object)
      );
    });

    // package-2 only has prepublish lifecycle
    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      path.join(cwd, "packages/package-2"),
      expect.objectContaining({
        "ignore-prepublish": false,
        "ignore-scripts": false,
      })
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
      ["lifecycle", "prepublish"],
      ["lifecycle", "prepare"],
      ["lifecycle", "prepublishOnly"],
      ["lifecycle", "prepack"],
      ["lifecycle", "postpack"],
      ["lifecycle", "postpublish"],
    ]);

    expect(Array.from(loadJsonFile.registry.keys())).toStrictEqual([
      "/packages/package-1",
      "/packages/package-2",
    ]);
  });

  it("does not execute recursive root scripts", async () => {
    const cwd = await initFixture("lifecycle");

    process.env.npm_lifecycle_event = "prepublish";

    await lernaPublish(cwd)();

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
      ["lifecycle", "postpack"],
    ]);
  });

  it("does not duplicate rooted leaf scripts", async () => {
    const cwd = await initFixture("lifecycle-rooted-leaf");

    await lernaPublish(cwd)();

    expect(runLifecycle.getOrderedCalls()).toEqual([
      // TODO: separate from VersionCommand details
      ["package-1", "preversion"],
      ["package-1", "version"],
      ["lifecycle-rooted-leaf", "preversion"],
      ["lifecycle-rooted-leaf", "version"],
      ["lifecycle-rooted-leaf", "postversion"],
      ["package-1", "postversion"],
      // NO publish-specific root lifecycles should be duplicated
      // (they are all run by pack-directory and npm-publish)
    ]);
  });

  it("respects --ignore-prepublish", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)("--ignore-prepublish");

    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      path.join(cwd, "packages/package-2"),
      expect.objectContaining({
        "ignore-prepublish": true,
      })
    );

    // runLifecycle() is _called_ with "prepublish" for root,
    // but it does not actually execute, and is tested elsewhere
  });

  it("respects --ignore-scripts", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaPublish(cwd)("--ignore-scripts");

    // despite all the scripts being passed to runLifecycle() (and implicitly, packDirectory()),
    // none of them will actually execute as long as opts["ignore-scripts"] is provided
    expect(runLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ name: "lifecycle" }),
      "prepare",
      expect.objectContaining({
        "ignore-scripts": true,
      })
    );
    expect(packDirectory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "package-2" }),
      path.join(cwd, "packages/package-2"),
      expect.objectContaining({
        "ignore-scripts": true,
      })
    );
  });
});
