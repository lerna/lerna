import { Tree } from "@nrwl/devkit";
import { createTreeWithEmptyWorkspace } from "@nrwl/devkit/testing";
import { generatorFactory } from "./generator";

const generator = generatorFactory({
  success() {},
});

describe("lerna create default-generator", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("should work", async () => {
    const name = "something-casey";
    await generator(tree, {
      name,
    });
    expect(tree.children(tree.root + `/${name}`)).toMatchInlineSnapshot(`
      Array [
        "README.md",
        "__tests__",
        "lib",
        "package.json",
      ]
    `);
    expect(tree.read(tree.root + `/${name}/package.json`, "utf-8")).toMatchInlineSnapshot(`
      "{
        \\"name\\": \\"something-casey\\",
        \\"version\\": \\"1.0.0\\",
        \\"description\\": \\"Now I’m the model of a modern major general / The venerated Virginian veteran whose men are all / Lining up, to put me up on a pedestal / Writin’ letters to relatives / Embellishin’ my elegance and eloquence / But the elephant is in the room / The truth is in ya face when ya hear the British cannons go / BOOM\\",
        \\"keywords\\": [],
        \\"author\\": \\"“JamesHenry” <james@henry.sc>\\",
        \\"homepage\\": \\"https://github.com/ChainSafe/web3.js/tree/main/packages/something-casey#readme\\",
        \\"license\\": \\"ISC\\",
        \\"main\\": \\"lib/something-casey.js\\",
        \\"directories\\": {
          \\"lib\\": \\"lib\\",
          \\"test\\": \\"__tests__\\"
        },
        \\"files\\": [
          \\"lib\\"
        ],
        \\"repository\\": {
          \\"type\\": \\"git\\",
          \\"url\\": \\"git+https://github.com/web3/web3.js.git\\"
        },
        \\"scripts\\": {
          \\"test\\": \\"node ./__tests__/something-casey.test.js\\"
        },
        \\"bugs\\": {
          \\"url\\": \\"https://github.com/web3/web3.js/issues\\"
        }
      }
      "
    `);
  });
});
