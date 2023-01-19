import { commandRunner, initFixtureFactory, loggingOutput } from "@lerna/test-helpers";
import fs from "fs-extra";
import path from "path";
import tempy from "tempy";

const initFixture = initFixtureFactory(__dirname);

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaInit = commandRunner(require("../command"));

describe("InitCommand", () => {
  const lernaVersion = "__TEST_VERSION__";

  it("should link to docs site after success", async () => {
    const testDir = tempy.directory();

    await lernaInit(testDir)();

    const logMessages = loggingOutput("info");
    expect(logMessages).toContain(
      "New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started"
    );
  });

  describe("in an empty directory", () => {
    it("initializes git repo with lerna files", async () => {
      const testDir = tempy.directory();

      await lernaInit(testDir)();

      const [lernaJson, pkgJson, packagesDirExists, gitDirExists] = await Promise.all([
        fs.readJSON(path.join(testDir, "lerna.json")),
        fs.readJSON(path.join(testDir, "package.json")),
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fs.exists(path.join(testDir, "packages")),
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fs.exists(path.join(testDir, ".git")),
      ]);

      expect(lernaJson).toMatchInlineSnapshot(`
        Object {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "useWorkspaces": true,
          "version": "0.0.0",
        }
      `);
      expect(pkgJson).toMatchInlineSnapshot(`
        Object {
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
      expect(packagesDirExists).toBe(true);
      expect(gitDirExists).toBe(true);
    });

    it("initializes .gitignore", async () => {
      const testDir = tempy.directory();

      await lernaInit(testDir)();

      const gitIgnorePath = path.join(testDir, ".gitignore");
      const gitIgnoreContent = await fs.readFile(gitIgnorePath, "utf8");

      expect(gitIgnoreContent).toMatchInlineSnapshot(`"node_modules/"`);
    });

    it("initializes git repo with lerna files in independent mode", async () => {
      const testDir = tempy.directory();

      await lernaInit(testDir)("--independent");

      expect(await fs.readJSON(path.join(testDir, "lerna.json"))).toHaveProperty("version", "independent");
    });

    describe("with --exact", () => {
      it("uses exact version when adding lerna dependency", async () => {
        const testDir = tempy.directory();

        await lernaInit(testDir)("--exact");

        expect(await fs.readJSON(path.join(testDir, "package.json"))).toMatchObject({
          devDependencies: {
            lerna: lernaVersion,
          },
        });
      });

      it("sets lerna.json command.init.exact to true", async () => {
        const testDir = tempy.directory();

        await lernaInit(testDir)("--exact");

        expect(await fs.readJSON(path.join(testDir, "lerna.json"))).toMatchObject({
          $schema: "node_modules/lerna/schemas/lerna-schema.json",
          command: {
            init: {
              exact: true,
            },
          },
        });
      });
    });

    it("creates packages directory", async () => {
      const testDir = tempy.directory();

      await lernaInit(testDir)();

      expect(fs.existsSync(path.join(testDir, "packages"))).toBe(true);
    });
  });

  describe("in a subdirectory of a git repo", () => {
    it("creates lerna files", async () => {
      const dir = await initFixture("empty");
      const testDir = path.join(dir, "subdir");

      await fs.ensureDir(testDir);
      await lernaInit(testDir)();

      const [lernaJson, pkgJson, packagesDirExists] = await Promise.all([
        fs.readJSON(path.join(testDir, "lerna.json")),
        fs.readJSON(path.join(testDir, "package.json")),
        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        fs.exists(path.join(testDir, "packages")),
      ]);

      expect(lernaJson).toMatchInlineSnapshot(`
        Object {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "useWorkspaces": true,
          "version": "0.0.0",
        }
      `);
      expect(pkgJson).toMatchInlineSnapshot(`
        Object {
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
      expect(packagesDirExists).toBe(true);
    });
  });

  describe("when .gitignore exists", () => {
    it("does not change existing .gitignore", async () => {
      const testDir = await tempy.directory();

      const gitIgnorePath = path.join(testDir, ".gitignore");
      await fs.writeFile(gitIgnorePath, "dist/");

      await lernaInit(testDir)();

      const gitIgnoreContent = await fs.readFile(gitIgnorePath, "utf8");

      expect(gitIgnoreContent).toMatchInlineSnapshot(`"dist/"`);
    });
  });

  describe("when package.json exists", () => {
    it("adds lerna to sorted devDependencies", async () => {
      const testDir = await initFixture("has-package");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        devDependencies: {
          alpha: "first",
          omega: "last",
        },
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        devDependencies: {
          alpha: "first",
          lerna: `^${lernaVersion}`,
          omega: "last",
        },
      });
    });

    it("updates existing lerna in devDependencies", async () => {
      const testDir = await initFixture("has-package");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: "0.1.100",
        },
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: "first",
          omega: "last",
        },
        devDependencies: {
          lerna: `^${lernaVersion}`,
        },
      });
    });

    it("updates existing lerna in sorted dependencies", async () => {
      const testDir = await initFixture("has-package");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(pkgJsonPath, {
        dependencies: {
          alpha: "first",
          lerna: "0.1.100",
          omega: "last",
        },
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
        dependencies: {
          alpha: "first",
          lerna: `^${lernaVersion}`,
          omega: "last",
        },
      });
    });

    describe("when workspaces are already configured", () => {
      it("does not overwrite existing workspaces", async () => {
        const testDir = await initFixture("has-package");
        const pkgJsonPath = path.join(testDir, "package.json");

        await fs.outputJSON(pkgJsonPath, {
          workspaces: ["modules/*", "others/*"],
        });

        await lernaInit(testDir)();

        expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
          workspaces: ["modules/*", "others/*"],
        });
      });
    });

    describe("when workspaces are not yet configured", () => {
      it("sets workspaces to include default packages location", async () => {
        const testDir = await initFixture("has-package");
        const pkgJsonPath = path.join(testDir, "package.json");

        await lernaInit(testDir)();

        expect(await fs.readJSON(pkgJsonPath)).toMatchObject({
          workspaces: ["packages/*"],
        });
      });
    });
  });

  describe("when lerna.json exists", () => {
    describe("when useWorkspaces is false or missing", () => {
      it("updates to explicitly set $schema, and packages", async () => {
        const testDir = await initFixture("has-lerna");
        const lernaJsonPath = path.join(testDir, "lerna.json");

        await fs.outputJSON(lernaJsonPath, {
          lerna: "0.1.100",
          version: "1.2.3",
        });

        await lernaInit(testDir)();

        expect(await fs.readJSON(lernaJsonPath)).toMatchInlineSnapshot(`
          Object {
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "packages": Array [
              "packages/*",
            ],
            "useWorkspaces": false,
            "version": "1.2.3",
          }
        `);
      });
    });

    it("creates package.json without workspaces configured", async () => {
      const testDir = await initFixture("has-lerna");
      const lernaJsonPath = path.join(testDir, "lerna.json");
      const packageJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(lernaJsonPath, {
        lerna: "0.1.100",
        version: "1.2.3",
      });

      await lernaInit(testDir)();

      expect(await fs.readJSON(packageJsonPath)).toMatchInlineSnapshot(`
        Object {
          "devDependencies": Object {
            "lerna": "^__TEST_VERSION__",
          },
          "name": "root",
          "private": true,
        }
      `);
    });

    it("creates package directories when glob is configured", async () => {
      const testDir = await initFixture("has-lerna");
      const lernaJsonPath = path.join(testDir, "lerna.json");

      await fs.outputJSON(lernaJsonPath, {
        version: "1.2.3",
        packages: ["modules/*"],
      });

      await lernaInit(testDir)();

      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      expect(await fs.exists(path.join(testDir, "modules"))).toBe(true);
    });

    describe("when useNx is false", () => {
      it("preserves useNx false", async () => {
        const testDir = await initFixture("has-lerna");
        const lernaJsonPath = path.join(testDir, "lerna.json");

        await fs.outputJSON(lernaJsonPath, {
          lerna: "0.1.100",
          version: "1.2.3",
          useNx: false,
        });

        await lernaInit(testDir)();

        expect(await fs.readJSON(lernaJsonPath)).toMatchInlineSnapshot(`
          Object {
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "packages": Array [
              "packages/*",
            ],
            "useNx": false,
            "useWorkspaces": false,
            "version": "1.2.3",
          }
        `);

        expect(await fs.readJSON(path.join(testDir, "package.json"))).toMatchInlineSnapshot(`
          Object {
            "devDependencies": Object {
              "lerna": "^__TEST_VERSION__",
            },
            "name": "root",
            "private": true,
          }
        `);
      });
    });

    describe("when useNx is true", () => {
      it("removes useNx true as it would do nothing", async () => {
        const testDir = await initFixture("has-lerna");
        const lernaJsonPath = path.join(testDir, "lerna.json");

        await fs.outputJSON(lernaJsonPath, {
          lerna: "0.1.100",
          version: "1.2.3",
          useNx: true,
        });

        await lernaInit(testDir)();

        expect(await fs.readJSON(lernaJsonPath)).toMatchInlineSnapshot(`
          Object {
            "$schema": "node_modules/lerna/schemas/lerna-schema.json",
            "packages": Array [
              "packages/*",
            ],
            "useWorkspaces": false,
            "version": "1.2.3",
          }
        `);
      });
    });
  });

  describe("when re-initializing with --exact", () => {
    it("sets lerna.json command.init.exact to true and explicitly sets useWorkspaces, $schema, and packages", async () => {
      const testDir = await initFixture("updates");
      const lernaJsonPath = path.join(testDir, "lerna.json");
      const pkgJsonPath = path.join(testDir, "package.json");

      await fs.outputJSON(lernaJsonPath, {
        lerna: "0.1.100",
        commands: {
          bootstrap: {
            hoist: true,
          },
        },
        $schema: "node_modules/lerna/schemas/lerna-schema.json",
        version: "1.2.3",
      });
      await fs.outputJSON(pkgJsonPath, {
        devDependencies: {
          lerna: lernaVersion,
        },
      });

      await lernaInit(testDir)("--exact");

      expect(await fs.readJSON(lernaJsonPath)).toMatchInlineSnapshot(`
        Object {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "command": Object {
            "bootstrap": Object {
              "hoist": true,
            },
            "init": Object {
              "exact": true,
            },
          },
          "packages": Array [
            "packages/*",
          ],
          "useWorkspaces": false,
          "version": "1.2.3",
        }
      `);
    });
  });
});
