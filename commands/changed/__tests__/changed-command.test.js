"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

const path = require("path");
const touch = require("touch");

// mocked modules
const output = require("@lerna/output");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const updateLernaConfig = require("@lerna-test/update-lerna-config");

// file under test
const lernaChanged = require("@lerna-test/command-runner")(require("../command"));

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
expect.addSnapshotSerializer(require("@lerna-test/serialize-windows-paths"));
expect.addSnapshotSerializer(require("@lerna-test/serialize-tempdir"));

const setupGitChanges = async (cwd, filePaths) => {
  await gitTag(cwd, "v1.0.0");
  await Promise.all(filePaths.map(fp => touch(path.join(cwd, fp))));
  await gitAdd(cwd, "-A");
  await gitCommit(cwd, "Commit");
};

describe("ChangedCommand", () => {
  /** =========================================================================
   * Basic
   * ======================================================================= */

  describe("basic", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)();

      expect(output.logged()).toMatchInlineSnapshot(`
package-2
package-3
`);
    });

    it("should list all packages when no tag is found", async () => {
      const testDir = await initFixture("basic");

      await lernaChanged(testDir)();

      expect(output.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
    });

    it("should list changes with --force-publish", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--force-publish");

      expect(output.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
    });

    it("should list changes with --force-publish package-2,package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2,package-4");

      expect(output.logged()).toMatchInlineSnapshot(`
package-2
package-3
package-4
`);
    });

    it("should list changes with --force-publish package-2 --force-publish package-4", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2", "--force-publish", "package-4");

      expect(output.logged()).toMatchInlineSnapshot(`
package-2
package-3
package-4
`);
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("basic");

      await updateLernaConfig(testDir, {
        command: {
          publish: {
            ignoreChanges: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(output.logged()).toMatchInlineSnapshot(`package-3`);
    });

    it("should list changes in private packages with --all", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-5/random-file"]);
      await lernaChanged(testDir)("--all");

      expect(output.logged()).toMatchInlineSnapshot(`package-5 (PRIVATE)`);
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("basic");

      await gitTag(testDir, "v1.0.0");
      await lernaChanged(testDir)();

      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });

    it("supports all listable flags", async () => {
      const testDir = await initFixture("basic");

      await lernaChanged(testDir)("-alp");

      expect(output.logged()).toMatchInlineSnapshot(`
__TEST_ROOTDIR__/packages/package-1:package-1:1.0.0
__TEST_ROOTDIR__/packages/package-2:package-2:1.0.0
__TEST_ROOTDIR__/packages/package-3:package-3:1.0.0
__TEST_ROOTDIR__/packages/package-4:package-4:1.0.0
__TEST_ROOTDIR__/packages/package-5:package-5:1.0.0:PRIVATE
`);
    });
  });

  /** =========================================================================
   * Circular
   * ======================================================================= */

  describe("circular", () => {
    it("should list changes", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(output.logged()).toMatchInlineSnapshot(`
package-3
package-4
`);
    });

    it("should list changes with --force-publish *", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--force-publish", "*");

      expect(output.logged()).toMatchInlineSnapshot(`
package-1
package-2
package-3
package-4
`);
    });

    it("should list changes with --force-publish package-2", async () => {
      const testDir = await initFixture("circular");

      await setupGitChanges(testDir, ["packages/package-4/random-file"]);
      await lernaChanged(testDir)("--force-publish", "package-2");

      expect(output.logged()).toMatchInlineSnapshot(`
package-2
package-3
package-4
`);
    });

    it("should list changes without ignored files", async () => {
      const testDir = await initFixture("circular");

      await updateLernaConfig(testDir, {
        command: {
          publish: {
            ignore: ["ignored-file"],
          },
        },
      });

      await setupGitChanges(testDir, ["packages/package-2/ignored-file", "packages/package-3/random-file"]);
      await lernaChanged(testDir)();

      expect(output.logged()).toMatchInlineSnapshot(`
package-3
package-4
`);
    });

    it("should return a non-zero exit code when there are no changes", async () => {
      const testDir = await initFixture("circular");

      await gitTag(testDir, "v1.0.0");
      await lernaChanged(testDir)();

      expect(process.exitCode).toBe(1);

      // reset exit code
      process.exitCode = undefined;
    });
  });

  /** =========================================================================
   * JSON Output
   * ======================================================================= */

  describe("with --json", () => {
    it("should list changes as a json object", async () => {
      const testDir = await initFixture("basic");

      await setupGitChanges(testDir, ["packages/package-2/random-file"]);
      await lernaChanged(testDir)("--json");

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
});
