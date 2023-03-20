import { createSymlink as _createSymlink } from "@lerna/core";
import { commandRunner, initFixtureFactory, normalizeRelativeDir } from "@lerna/test-helpers";

const initFixture = initFixtureFactory(__dirname);

// eslint-disable-next-line jest/no-mocks-import
jest.mock("@lerna/core", () => require("@lerna/test-helpers/__mocks__/@lerna/core"));

const createSymlink = jest.mocked(_createSymlink);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaLink = commandRunner(require("../command"));

// assertion helpers
const symlinkedDirectories = (testDir: string) =>
  createSymlink.mock.calls
    .slice()
    // ensure sort is always consistent, despite promise variability
    .sort((a, b) => {
      // two-dimensional path sort
      if (b[0] === a[0]) {
        if (b[1] === a[1]) {
          // ignore third field
          return 0;
        }

        return b[1] < a[1] ? 1 : -1;
      }

      return (b[0] ?? "") < (a[0] ?? "") ? 1 : -1;
    })
    .map(([src, dest, type]) => ({
      _src: normalizeRelativeDir(testDir, src!),
      dest: normalizeRelativeDir(testDir, dest),
      type,
    }));

// TODO: troubleshoot and reenable
describe.skip("LinkCommand", () => {
  // the underlying implementation of symlinkDependencies
  createSymlink.mockResolvedValue();

  describe("with local package dependencies", () => {
    it("should symlink all packages", async () => {
      const testDir = await initFixture("basic");
      await lernaLink(testDir)();

      expect(symlinkedDirectories(testDir)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_src": "packages/package-1",
            "dest": "packages/package-2/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-1",
            "dest": "packages/package-3/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2",
            "dest": "packages/package-3/node_modules/@test/package-2",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/cli.js",
            "dest": "packages/package-3/node_modules/.bin/package-2",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3",
            "dest": "packages/package-4/node_modules/package-3",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-3/cli1.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli1",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/cli2.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli2",
            "type": "exec",
          },
        ]
        `);
    });
  });

  describe("with publishConfig.directory", () => {
    it("should symlink sub-directory of package folders and bin directories", async () => {
      const testDir = await initFixture("with-contents");
      await lernaLink(testDir)();

      expect(symlinkedDirectories(testDir)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_src": "packages/package-1/dist",
            "dest": "packages/package-2/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-1/dist",
            "dest": "packages/package-3/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/dist",
            "dest": "packages/package-3/node_modules/@test/package-2",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/dist/cli.js",
            "dest": "packages/package-3/node_modules/.bin/package-2",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/dist",
            "dest": "packages/package-4/node_modules/package-3",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-3/dist/cli1.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli1",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/dist/cli2.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli2",
            "type": "exec",
          },
        ]
        `);
    });
  });

  describe("with --force-local", () => {
    it("should force symlink of all packages", async () => {
      const testDir = await initFixture("force-local");
      await lernaLink(testDir)();

      expect(symlinkedDirectories(testDir)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_src": "packages/package-1",
            "dest": "packages/package-2/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-1",
            "dest": "packages/package-3/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-1",
            "dest": "packages/package-4/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2",
            "dest": "packages/package-3/node_modules/@test/package-2",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/cli.js",
            "dest": "packages/package-3/node_modules/.bin/package-2",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3",
            "dest": "packages/package-4/node_modules/package-3",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-3/cli1.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli1",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/cli2.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli2",
            "type": "exec",
          },
        ]
        `);
    });
  });

  describe("with --contents", () => {
    it("should symlink sub-directory of package folders and bin directories", async () => {
      const testDir = await initFixture("with-contents");
      await lernaLink(testDir)("--contents", "build");

      expect(symlinkedDirectories(testDir)).toMatchInlineSnapshot(`
        Array [
          Object {
            "_src": "packages/package-1/build",
            "dest": "packages/package-2/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-1/build",
            "dest": "packages/package-3/node_modules/@test/package-1",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/build",
            "dest": "packages/package-3/node_modules/@test/package-2",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-2/build/cli.js",
            "dest": "packages/package-3/node_modules/.bin/package-2",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/build",
            "dest": "packages/package-4/node_modules/package-3",
            "type": "junction",
          },
          Object {
            "_src": "packages/package-3/build/cli1.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli1",
            "type": "exec",
          },
          Object {
            "_src": "packages/package-3/build/cli2.js",
            "dest": "packages/package-4/node_modules/.bin/package3cli2",
            "type": "exec",
          },
        ]
        `);
    });
  });

  describe("with pnpm", () => {
    it("should throw validation error", async () => {
      const testDir = await initFixture("pnpm");
      const command = lernaLink(testDir)();

      await expect(command).rejects.toThrow(
        "Link is not supported with pnpm workspaces, since pnpm will automatically link dependencies during `pnpm install`. See the pnpm docs for details: https://pnpm.io/workspaces"
      );
    });
  });
});
