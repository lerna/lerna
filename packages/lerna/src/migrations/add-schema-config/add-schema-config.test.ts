import { readJson, Tree, writeJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import addSchemaConfigMigration from "./add-schema-config";

describe("add-schema-config", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it(`should add "$schema" config if not already present`, async () => {
    writeJson(tree, "lerna.json", {});
    await addSchemaConfigMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
      Object {
        "$schema": "node_modules/lerna/schemas/lerna-schema.json",
      }
    `);
  });

  it(`should not not modify the "$schema" config if it is already present`, async () => {
    writeJson(tree, "lerna.json", {
      $schema: "./some/path/to/schema.json",
    });
    await addSchemaConfigMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
      Object {
        "$schema": "./some/path/to/schema.json",
      }
    `);
  });
});
