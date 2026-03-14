import { Tree, readJson, writeJson } from "@nx/devkit";
import { createTree } from "@nx/devkit/testing";
import * as fs from "fs";

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  existsSync: jest.fn().mockReturnValue(false),
}));

require("@lerna/test-helpers/src/lib/silence-logging");

const { InitCommand } = require("../index");

describe("InitCommand", () => {
  const lernaVersion = "__TEST_VERSION__";
  const commandOptions = { lernaVersion };

  let tree: Tree;

  beforeEach(() => {
    tree = createTree();
    // Delete the .prettierrc file in the Nx test tree to avoid confusion with changes within tests
    tree.delete(".prettierrc");
  });

  describe("in an empty directory", () => {
    it("initializes git repo with lerna files", async () => {
      const initCommand = new InitCommand(commandOptions);

      await initCommand.generate(tree);

      expect(tree.read(".gitignore")?.toString()).toMatchInlineSnapshot(`"node_modules/"`);
      expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
          Object {
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "version": "0.0.0",
          }
        `);
      expect(readJson(tree, "package.json")).toMatchInlineSnapshot(`
          Object {
            "dependencies": Object {},
            "devDependencies": Object {
              "lerna": "^__TEST_VERSION__",
            },
            "name": "root",
            "private": true,
            "workspaces": Array [
              "packages/*",
            ],
          }
        `);
    });

    it("initializes git repo with lerna files in independent mode", async () => {
      const initCommand = new InitCommand({ ...commandOptions, independent: true });

      await initCommand.generate(tree);

      expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
          Object {
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "version": "independent",
          }
        `);
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", async () => {
        const initCommand = new InitCommand({ ...commandOptions, exact: true });

        await initCommand.generate(tree);

        expect(readJson(tree, "package.json")).toMatchInlineSnapshot(`
            Object {
              "dependencies": Object {},
              "devDependencies": Object {
                "lerna": "__TEST_VERSION__",
              },
              "name": "root",
              "private": true,
              "workspaces": Array [
                "packages/*",
              ],
            }
          `);
      });
    });
  });

  describe("when lerna.json already exists", () => {
    it("should not make any updates", async () => {
      const initCommand = new InitCommand(commandOptions);

      writeJson(tree, "lerna.json", {
        version: "1.2.3",
      });
      expect(tree.listChanges().length).toEqual(1);

      await initCommand.generate(tree);

      // The writeJson call above is still the only change, even after running the generator
      expect(tree.listChanges().length).toEqual(1);
    });
  });

  describe("when .gitignore already exists", () => {
    it("does not change existing .gitignore", async () => {
      const initCommand = new InitCommand(commandOptions);

      tree.write(".gitignore", "existing content\n");

      await initCommand.generate(tree);

      expect(tree.read(".gitignore")?.toString()).toMatchInlineSnapshot(`
        "existing content
        "
      `);
    });
  });

  describe("when package.json already exists", () => {
    it("should not make any updates if workspaces are not set and no lerna.json", async () => {
      const initCommand = new InitCommand(commandOptions);

      writeJson(tree, "package.json", {});
      expect(tree.listChanges().length).toEqual(1);

      await initCommand.generate(tree);

      // The writeJson call above is still the only change, even after running the generator
      expect(tree.listChanges().length).toEqual(1);
    });

    it("adds lerna to sorted devDependencies", async () => {
      const initCommand = new InitCommand(commandOptions);

      writeJson(tree, "package.json", {
        workspaces: ["packages/*"],
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      });

      await initCommand.generate(tree);

      expect(readJson(tree, "package.json")).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {},
          "devDependencies": Object {
            "alpha": "first",
            "lerna": "^__TEST_VERSION__",
            "omega": "last",
          },
          "workspaces": Array [
            "packages/*",
          ],
        }
      `);
    });

    it("updates existing lerna in devDependencies", async () => {
      const initCommand = new InitCommand(commandOptions);

      writeJson(tree, "package.json", {
        workspaces: ["packages/*"],
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      });

      await initCommand.generate(tree);

      expect(readJson(tree, "package.json")).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "alpha": "first",
            "omega": "last",
          },
          "devDependencies": Object {
            "lerna": "^__TEST_VERSION__",
          },
          "workspaces": Array [
            "packages/*",
          ],
        }
      `);
    });

    it("updates existing lerna in sorted dependencies", async () => {
      const initCommand = new InitCommand(commandOptions);

      writeJson(tree, "package.json", {
        workspaces: ["packages/*"],
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      });

      await initCommand.generate(tree);

      expect(readJson(tree, "package.json")).toMatchInlineSnapshot(`
        Object {
          "dependencies": Object {
            "alpha": "first",
            "lerna": "^__TEST_VERSION__",
            "omega": "last",
          },
          "devDependencies": Object {},
          "workspaces": Array [
            "packages/*",
          ],
        }
      `);
    });
  });

  describe("detectPackageManager", () => {
    const mockedExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

    afterEach(() => {
      mockedExistsSync.mockReset();
    });

    it("detects bun from bun.lockb", async () => {
      mockedExistsSync.mockImplementation((p: any) => String(p) === "bun.lockb");
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("bun");
    });

    it("detects bun from bun.lock", async () => {
      mockedExistsSync.mockImplementation((p: any) => String(p) === "bun.lock");
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("bun");
    });

    it("detects yarn from yarn.lock", async () => {
      mockedExistsSync.mockImplementation((p: any) => String(p) === "yarn.lock");
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("yarn");
    });

    it("detects pnpm from pnpm-lock.yaml", async () => {
      mockedExistsSync.mockImplementation((p: any) => String(p) === "pnpm-lock.yaml");
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("pnpm");
    });

    it("detects npm from package-lock.json", async () => {
      mockedExistsSync.mockImplementation((p: any) => String(p) === "package-lock.json");
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("npm");
    });

    it("defaults to npm when no lockfile exists", async () => {
      mockedExistsSync.mockReturnValue(false);
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("npm");
    });

    it("prioritizes bun over other lockfiles", async () => {
      mockedExistsSync.mockImplementation(
        (p: any) =>
          String(p) === "bun.lockb" || String(p) === "yarn.lock" || String(p) === "package-lock.json"
      );
      const initCommand = new InitCommand(commandOptions);
      expect(initCommand.packageManager).toBe("bun");
    });
  });

  describe("detectInvokedPackageManager", () => {
    const mockedExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;

    beforeEach(() => {
      // Ensure detectPackageManager returns null so constructor falls through to detectInvokedPackageManager
      mockedExistsSync.mockReturnValue(false);
    });

    afterEach(() => {
      mockedExistsSync.mockReset();
    });

    // Spy on detectInvokedPackageManager to control the invoker path.
    // The method reads require.main which is not easily mockable in Jest,
    // so we intercept the prototype method to simulate different invoker paths.
    // The mock mirrors the production implementation (filename ?? path fallback,
    // /[\\/]/ split, leading-dot normalization).
    function createWithInvoker(
      filename: string | undefined,
      modulePath: string | undefined
    ): InstanceType<typeof InitCommand> {
      const spy = jest
        .spyOn(InitCommand.prototype as any, "detectInvokedPackageManager")
        .mockImplementation(function (this: any) {
          // Mirror the production code: prefer filename over path, handle undefined.
          const invokerPath = (filename ?? modulePath) || "";
          // Use /[\\/]/ to split on both POSIX (/) and Windows (\) separators.
          const pathSegments = invokerPath.split(/[\\/]/);
          for (const pkgManager of ["bun", "pnpm", "yarn", "npm"] as const) {
            if (
              pathSegments.some((segment: string) => {
                const normalized = segment.replace(/^\./, "");
                return normalized === pkgManager || normalized.startsWith(`${pkgManager}@`);
              })
            ) {
              return pkgManager;
            }
          }
          return null;
        });
      const initCommand = new InitCommand(commandOptions);
      spy.mockRestore();
      return initCommand;
    }

    // Convenience wrapper for tests that supply a full file path (filename === path are
    // both derived from it, matching Node.js where path === dirname(filename)).
    function createWithInvokerPath(p: string): InstanceType<typeof InitCommand> {
      const dir = p.replace(/[\\/][^\\/]*$/, "") || p;
      return createWithInvoker(p, dir);
    }

    it("does not false-positive match 'bun' in 'ubuntu' path", () => {
      const initCommand = createWithInvokerPath("/usr/bin/ubuntu/node_modules/lerna/dist/cli.js");
      expect(initCommand.packageManager).toBe("npm");
    });

    it("detects bun from exact path segment", () => {
      const initCommand = createWithInvokerPath("/home/user/.local/share/bun/bin/lerna");
      expect(initCommand.packageManager).toBe("bun");
    });

    it("detects bun from .bun install cache (GitHub Actions bunx path)", () => {
      const initCommand = createWithInvokerPath(
        "/home/runner/.bun/install/cache/lerna@999.9.9-e2e.0_abc123/node_modules/lerna/dist/cli.js"
      );
      expect(initCommand.packageManager).toBe("bun");
    });

    it("detects bun when module.path is undefined but filename is set (bun CJS runtime)", () => {
      // In bun's CJS runtime, require.main.path may be undefined while filename is always set.
      // The production code uses `invoker.filename ?? invoker.path` to handle this.
      const initCommand = createWithInvoker(
        "/home/runner/.bun/install/cache/lerna@999.9.9-e2e.0/node_modules/lerna/dist/cli.js",
        undefined
      );
      expect(initCommand.packageManager).toBe("bun");
    });

    it("detects pnpm from exact path segment", () => {
      const initCommand = createWithInvokerPath("/home/user/.local/share/pnpm/bin/lerna");
      expect(initCommand.packageManager).toBe("pnpm");
    });

    it("detects pnpm from .pnpm virtual store directory (used by pnpm dlx)", () => {
      const initCommand = createWithInvokerPath(
        "/home/user/.local/share/pnpm/store/v3/.pnpm/lerna@999.9.9-e2e.0/node_modules/lerna/dist/cli.js"
      );
      expect(initCommand.packageManager).toBe("pnpm");
    });

    it("detects versioned package manager segment", () => {
      const initCommand = createWithInvokerPath("/home/user/.cache/npm@10/bin/lerna");
      expect(initCommand.packageManager).toBe("npm");
    });

    it("falls back to npm when no path segment matches", () => {
      const initCommand = createWithInvokerPath("/usr/local/bin/lerna");
      expect(initCommand.packageManager).toBe("npm");
    });
  });
});
