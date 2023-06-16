import { readJson, Tree, writeJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import removeInvalidConfigMigration from "./remove-invalid-lerna-config";

describe("remove-invalid-lerna-config", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it(`should remove "lerna" config if present`, async () => {
    writeJson(tree, "lerna.json", {
      lerna: "2.0.0-rc.5",
    });
    await removeInvalidConfigMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`Object {}`);
  });

  it(`should not not modify the file if no "lerna" config is present`, async () => {
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
