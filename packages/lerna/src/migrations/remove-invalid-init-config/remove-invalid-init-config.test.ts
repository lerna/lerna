import { readJson, Tree, writeJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import removeInvalidConfigMigration from "./remove-invalid-init-config";

describe("remove-invalid-init-config", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it(`should remove "init" config if present`, async () => {
    writeJson(tree, "lerna.json", {
      init: {
        exact: true,
        independent: false,
      },
    });
    await removeInvalidConfigMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`Object {}`);
  });

  it(`should not not modify the file if no "init" config is present`, async () => {
    writeJson(tree, "lerna.json", {
      something: false,
      somethingElse: {
        nested: "value",
      },
    });
    await removeInvalidConfigMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
      Object {
        "something": false,
        "somethingElse": Object {
          "nested": "value",
        },
      }
    `);
  });
});
