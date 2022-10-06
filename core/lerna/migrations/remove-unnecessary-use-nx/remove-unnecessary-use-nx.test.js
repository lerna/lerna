// @ts-check
const { createTreeWithEmptyWorkspace } = require("@nrwl/devkit/testing");
const { writeJson, readJson } = require("@nrwl/devkit");
const { default: removeUnnecessaryUseNxMigration } = require("./remove-unnecessary-use-nx");

describe("remove-unnecessary-use-nx migration", () => {
  let tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should remove useNx if set to true", async () => {
    writeJson(tree, "lerna.json", {
      useNx: true,
    });
    await removeUnnecessaryUseNxMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`Object {}`);
  });

  it("should not remove useNx if set to false", async () => {
    writeJson(tree, "lerna.json", {
      useNx: false,
    });
    await removeUnnecessaryUseNxMigration(tree);
    expect(readJson(tree, "lerna.json")).toMatchInlineSnapshot(`
      Object {
        "useNx": false,
      }
    `);
  });
});
