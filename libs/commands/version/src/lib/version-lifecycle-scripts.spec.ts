import { runLifecycle as _runLifecycle } from "@lerna/core";
import { commandRunner, initFixtureFactory } from "@lerna/test-helpers";
import _loadJsonFile from "load-json-file";
import versionCommand from "../command";

vi.mock("load-json-file", () => import("@lerna/test-helpers/__mocks__/load-json-file"));

vi.mock("@lerna/core", async () => ({
  ...(await vi.importActual("@lerna/core")),
  ...(await import("@lerna/test-helpers/__mocks__/@lerna/core")),
}));

vi.mock("./git-push");
vi.mock("./is-anything-committed", async () => ({
  isAnythingCommitted: vi.fn().mockReturnValue(true),
}));
vi.mock("./is-behind-upstream", async () => ({
  isBehindUpstream: vi.fn().mockReturnValue(false),
}));
vi.mock("./remote-branch-exists", async () => ({
  remoteBranchExists: vi.fn().mockResolvedValue(true),
}));

// The mocked version isn't the same as the real one
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadJsonFile = _loadJsonFile as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runLifecycle = _runLifecycle as any;

const initFixture = initFixtureFactory(__dirname);

// test command

const lernaVersion = commandRunner(versionCommand);

describe("lifecycle scripts", () => {
  const npmLifecycleEvent = process.env.npm_lifecycle_event;

  afterEach(() => {
    process.env.npm_lifecycle_event = npmLifecycleEvent;
  });

  it("calls version lifecycle scripts for root and packages", async () => {
    const cwd = await initFixture("lifecycle");

    await lernaVersion(cwd)();

    expect(runLifecycle).toHaveBeenCalledTimes(6);

    ["preversion", "version", "postversion"].forEach((script) => {
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

    const orderedCalls = runLifecycle.getOrderedCalls();
    expect(orderedCalls).toEqual([
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
