import { output as _output, collectUpdates as _collectUpdates } from "@lerna/core";
import {
  initFixtureFactory,
  commandRunner,
  updateLernaConfig,
  loggingOutput,
  tempDirSerializer,
} from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaChanged = commandRunner(require("../command"));

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

// The mock modifies the exported symbols and therefore types
const output = _output as any;
const collectUpdates = _collectUpdates as any;

// remove quotes around top-level strings
expect.addSnapshotSerializer({
  test(val) {
    return typeof val === "string";
  },
  serialize(val, config, indentation, depth) {
    // top-level strings don't need quotes, but nested ones do (object properties, etc)
    return depth ? `"${val}"` : val;
  },
});

// normalize temp directory paths in snapshots
expect.addSnapshotSerializer(tempDirSerializer);

describe("ChangedCommand", () => {
  let cwd;

  beforeAll(async () => {
    cwd = await initFixture("normal");
  });

  it("lists changed packages", async () => {
    collectUpdates.setUpdated(cwd, "package-2", "package-3");

    await lernaChanged(cwd)();

    expect(output.logged()).toMatchInlineSnapshot(`
package-2
package-3
`);
  });

  it("passes --force-publish to update collector", async () => {
    await lernaChanged(cwd)("--force-publish");

    expect(output.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ forcePublish: true })
    );
  });

  it("passes --ignore-changes to update collector", async () => {
    await lernaChanged(cwd)("--ignore-changes", "**/cli-ignore");

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ ignoreChanges: ["**/cli-ignore"] })
    );
  });

  it("reads durable ignoreChanges config from version namespace", async () => {
    updateLernaConfig(cwd, {
      command: {
        version: {
          ignoreChanges: ["**/durable-ignore"],
        },
      },
    });

    await lernaChanged(cwd)();

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ ignoreChanges: ["**/durable-ignore"] })
    );
  });

  it("passes --include-merged-tags to update collector", async () => {
    await lernaChanged(cwd)("--include-merged-tags");

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ includeMergedTags: true })
    );
  });

  it("passes --conventional-graduate to update collector", async () => {
    await lernaChanged(cwd)("--conventional-graduate=*");

    expect(collectUpdates).toHaveBeenLastCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({ cwd }),
      expect.objectContaining({ conventionalGraduate: "*", conventionalCommits: true })
    );
  });

  it("warns when --force-publish superseded by --conventional-graduate", async () => {
    await lernaChanged(cwd)("--conventional-graduate", "foo", "--force-publish", "bar");

    const [logMessage] = loggingOutput("warn");
    expect(logMessage).toBe("--force-publish superseded by --conventional-graduate");
  });

  it("lists changed private packages with --all", async () => {
    collectUpdates.setUpdated(cwd, "package-5");

    await lernaChanged(cwd)("--all");

    expect(output.logged()).toBe("package-5 (PRIVATE)");
  });

  it("exits non-zero when there are no changed packages", async () => {
    collectUpdates.setUpdated(cwd);

    await lernaChanged(cwd)();

    expect(process.exitCode).toBe(1);

    // reset exit code
    process.exitCode = undefined;
  });

  it("supports all listable flags", async () => {
    await lernaChanged(cwd)("-alp");

    expect(output.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
__TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
`);
  });

  it("outputs a stringified array of result objects with --json", async () => {
    collectUpdates.setUpdated(cwd, "package-2", "package-3");

    await lernaChanged(cwd)("--json");

    // Output should be a parseable string
    const jsonOutput = JSON.parse(output.logged());
    expect(jsonOutput).toMatchInlineSnapshot(`
Array [
  Object {
    "location": "__TEST_ROOTDIR__/packages/package-2",
    "name": "package-2",
    "private": false,
    "version": "1.0.0",
  },
  Object {
    "location": "__TEST_ROOTDIR__/packages/package-3",
    "name": "package-3",
    "private": false,
    "version": "1.0.0",
  },
]
`);
  });
});
