import { Tree, readJson, writeJson } from "@nx/devkit";
import { createTree } from "@nx/devkit/testing";

require("@lerna/test-helpers/src/lib/silence-logging");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { InitCommand } = require("../index");

describe("InitCommand", () => {
  const lernaVersion = "__TEST_VERSION__";
  const commandOptions = { lernaVersion };

  let tree: Tree;

  beforeEach(() => {
    tree = createTree();
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
});
