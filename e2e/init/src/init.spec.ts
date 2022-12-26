import { Fixture } from "@lerna/e2e-utils";

describe("lerna-init", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-init",
      packageManager: "npm",
      initializeGit: false,
      runLernaInit: false,
      installDependencies: false,
    });
  });
  afterEach(() => fixture.destroy());

  it("should initialize a lerna workspace", async () => {
    const output = await fixture.lernaInit("", { keepDefaultOptions: true });

    expect(output.stderr).toMatchInlineSnapshot(`
      "lerna notice cli v999.9.9-e2e.0
      lerna info Initializing Git repository
      lerna info Creating .gitignore
      lerna info Creating package.json
      lerna info Creating lerna.json
      lerna info Creating packages directory
      lerna success Initialized Lerna files
      lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
      "
    `);

    expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
      "{
        \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
        \\"useWorkspaces\\": true,
        \\"version\\": \\"0.0.0\\"
      }
      "
    `);
    expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
      "{
        \\"name\\": \\"root\\",
        \\"private\\": true,
        \\"workspaces\\": [
          \\"packages/*\\"
        ],
        \\"devDependencies\\": {
          \\"lerna\\": \\"^999.9.9-e2e.0\\"
        }
      }
      "
    `);
    expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
  });

  describe("--independent", () => {
    it("should initialize a lerna workspace in independent versioning mode", async () => {
      const output = await fixture.lernaInit("--independent", { keepDefaultOptions: true });

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating .gitignore
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
          \\"useWorkspaces\\": true,
          \\"version\\": \\"independent\\"
        }
        "
      `);
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
        "{
          \\"name\\": \\"root\\",
          \\"private\\": true,
          \\"workspaces\\": [
            \\"packages/*\\"
          ],
          \\"devDependencies\\": {
            \\"lerna\\": \\"^999.9.9-e2e.0\\"
          }
        }
        "
      `);
      expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
    });
  });

  describe("--exact", () => {
    it("should initialize a lerna workspace with exact package version enforcement", async () => {
      const output = await fixture.lernaInit("--exact", { keepDefaultOptions: true });

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating .gitignore
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"command\\": {
            \\"init\\": {
              \\"exact\\": true
            }
          },
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
          \\"useWorkspaces\\": true,
          \\"version\\": \\"0.0.0\\"
        }
        "
      `);
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
        "{
          \\"name\\": \\"root\\",
          \\"private\\": true,
          \\"workspaces\\": [
            \\"packages/*\\"
          ],
          \\"devDependencies\\": {
            \\"lerna\\": \\"999.9.9-e2e.0\\"
          }
        }
        "
      `);
      expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
    });
  });

  describe("--independent --exact", () => {
    it("should initialize a lerna workspace in independent versioning mode with exact package version enforcement", async () => {
      const output = await fixture.lernaInit("--independent --exact", { keepDefaultOptions: true });

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating .gitignore
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"command\\": {
            \\"init\\": {
              \\"exact\\": true
            }
          },
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
          \\"useWorkspaces\\": true,
          \\"version\\": \\"independent\\"
        }
        "
      `);
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
        "{
          \\"name\\": \\"root\\",
          \\"private\\": true,
          \\"workspaces\\": [
            \\"packages/*\\"
          ],
          \\"devDependencies\\": {
            \\"lerna\\": \\"999.9.9-e2e.0\\"
          }
        }
        "
      `);
      expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
    });
  });
});
