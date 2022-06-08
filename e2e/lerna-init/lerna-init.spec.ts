import {
  createEmptyDirectoryForWorkspace,
  getPublishedVersion,
  readFile,
  removeWorkspace,
  runCommandAsync,
} from "../utils";

describe("lerna init", () => {
  afterEach(() => removeWorkspace());

  it("should initialize a lerna workspace", async () => {
    createEmptyDirectoryForWorkspace("lerna-init-test");

    /**
     * There is nothing about lerna init that is package manager specific, as no installation occurs
     * as part of the command, so we simply use npx here and resolve from verdaccio.
     */
    const output = await runCommandAsync(
      `npx --registry=http://localhost:4872/ --yes lerna@${getPublishedVersion()} init`
    );

    expect(output.stderr).toMatchInlineSnapshot(`
      "lerna notice cli v999.9.9-e2e.0
      lerna info Initializing Git repository
      lerna info Creating package.json
      lerna info Creating lerna.json
      lerna info Creating packages directory
      lerna success Initialized Lerna files
      "
    `);

    expect(readFile("lerna.json")).toMatchInlineSnapshot(`
      "{
        \\"packages\\": [
          \\"packages/*\\"
        ],
        \\"version\\": \\"0.0.0\\"
      }
      "
    `);
    expect(readFile("package.json")).toMatchInlineSnapshot(`
      "{
        \\"name\\": \\"root\\",
        \\"private\\": true,
        \\"devDependencies\\": {
          \\"lerna\\": \\"^999.9.9-e2e.0\\"
        }
      }
      "
    `);
  });
});
