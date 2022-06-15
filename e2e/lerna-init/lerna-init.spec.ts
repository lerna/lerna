import { createEmptyDirectoryForWorkspace, readFile, removeWorkspace, runLernaInit } from "../utils";

describe("lerna init", () => {
  afterEach(() => removeWorkspace());

  it("should initialize a lerna workspace", async () => {
    createEmptyDirectoryForWorkspace("lerna-init-test");

    const output = await runLernaInit();

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
        \\"useNx\\": false,
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

  describe("--independent", () => {
    it("should initialize a lerna workspace in independent versioning mode", async () => {
      createEmptyDirectoryForWorkspace("lerna-init-test");

      const output = await runLernaInit("--independent");

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
          \\"useNx\\": false,
          \\"version\\": \\"independent\\"
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

  describe("--exact", () => {
    it("should initialize a lerna workspace with exact package version enforcement", async () => {
      createEmptyDirectoryForWorkspace("lerna-init-test");

      const output = await runLernaInit("--exact");

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
          \\"command\\": {
            \\"init\\": {
              \\"exact\\": true
            }
          },
          \\"packages\\": [
            \\"packages/*\\"
          ],
          \\"useNx\\": false,
          \\"version\\": \\"0.0.0\\"
        }
        "
      `);
      expect(readFile("package.json")).toMatchInlineSnapshot(`
        "{
          \\"name\\": \\"root\\",
          \\"private\\": true,
          \\"devDependencies\\": {
            \\"lerna\\": \\"999.9.9-e2e.0\\"
          }
        }
        "
      `);
    });
  });

  describe("--independent --exact", () => {
    it("should initialize a lerna workspace in independent versioning mode with exact package version enforcement", async () => {
      createEmptyDirectoryForWorkspace("lerna-init-test");

      const output = await runLernaInit("--independent --exact");

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
          \\"command\\": {
            \\"init\\": {
              \\"exact\\": true
            }
          },
          \\"packages\\": [
            \\"packages/*\\"
          ],
          \\"useNx\\": false,
          \\"version\\": \\"independent\\"
        }
        "
      `);
      expect(readFile("package.json")).toMatchInlineSnapshot(`
        "{
          \\"name\\": \\"root\\",
          \\"private\\": true,
          \\"devDependencies\\": {
            \\"lerna\\": \\"999.9.9-e2e.0\\"
          }
        }
        "
      `);
    });
  });
});
