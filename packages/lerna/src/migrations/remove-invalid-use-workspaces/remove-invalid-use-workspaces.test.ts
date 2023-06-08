import { readJson, Tree, writeJson } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import removeInvalidUseWorkspacesMigration from "./remove-invalid-use-workspaces";

describe("remove-invalid-use-workspaces", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it(`should remove "useWorkspaces" config if present`, async () => {
    writeJson(tree, "lerna.json", {
      useWorkspaces: true,
    });
    await removeInvalidUseWorkspacesMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`Object {}`);

    writeJson(tree, "lerna.json", {
      useWorkspaces: false,
    });
    await removeInvalidUseWorkspacesMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`Object {}`);
  });

  it(`should not not modify the file if no "useWorkspaces" config is present`, async () => {
    writeJson(tree, "lerna.json", {
      something: false,
      somethingElse: {
        nested: "value",
      },
    });
    await removeInvalidUseWorkspacesMigration(tree);
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
