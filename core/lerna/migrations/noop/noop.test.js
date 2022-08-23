// @ts-check

const { createTreeWithEmptyWorkspace } = require("@nrwl/devkit/testing");
const { default: noopMigration } = require("./noop");

describe("noop migration", () => {
  let tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should be runnable and not throw", async () => {
    await expect(noopMigration(tree)).resolves.toBeUndefined();
  });
});
