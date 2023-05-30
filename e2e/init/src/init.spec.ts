import { Fixture } from "@lerna/e2e-utils";

describe("lerna-init", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-init",
      packageManager: "npm",
      initializeGit: false,
      lernaInit: false,
      installDependencies: false,
    });
  });
  afterEach(() => fixture.destroy());

  it("should initialize a lerna workspace", async () => {
    const output = await fixture.lernaInit();

    expect(output.stderr).toMatchInlineSnapshot(`
      "lerna notice cli v999.9.9-e2e.0
      lerna info Applying the following file system updates:
      CREATE lerna.json
      CREATE package.json
      CREATE .gitignore
      lerna info Initializing Git repository
      lerna success Initialized Lerna files
      lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
      "
    `);

    expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
      "{
        \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
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
        \\"dependencies\\": {},
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
      const output = await fixture.lernaInit("--independent");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        CREATE package.json
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
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
          \\"dependencies\\": {},
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
      const output = await fixture.lernaInit("--exact");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        CREATE package.json
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
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
          \\"dependencies\\": {},
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
      const output = await fixture.lernaInit("--independent --exact");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        CREATE package.json
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
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
          \\"dependencies\\": {},
          \\"devDependencies\\": {
            \\"lerna\\": \\"999.9.9-e2e.0\\"
          }
        }
        "
      `);
      expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
    });
  });

  describe("--packages", () => {
    it("should initialize a lerna workspace using custom packages configuration", async () => {
      const output = await fixture.lernaInit("--packages=components/* --packages=utils/*");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        CREATE package.json
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
          \\"version\\": \\"0.0.0\\",
          \\"packages\\": [
            \\"components/*\\",
            \\"utils/*\\"
          ]
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
          \\"dependencies\\": {},
          \\"devDependencies\\": {
            \\"lerna\\": \\"^999.9.9-e2e.0\\"
          }
        }
        "
      `);
      expect(await fixture.readWorkspaceFile(".gitignore")).toMatchInlineSnapshot(`"node_modules/"`);
    });
  });

  describe("--dryRun", () => {
    it("should print a preview of the files which will be created, but not write anything to disk", async () => {
      const output = await fixture.lernaInit("--dryRun");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info The following file system updates will be made:
        CREATE lerna.json [preview]
        + {
        +   \\"$schema\\": \\"node_modules/lerna/schemas/lerna-schema.json\\",
        +   \\"version\\": \\"0.0.0\\"
        + }
        +
        CREATE package.json [preview]
        + {
        +   \\"name\\": \\"root\\",
        +   \\"private\\": true,
        +   \\"workspaces\\": [
        +     \\"packages/*\\"
        +   ],
        +   \\"dependencies\\": {},
        +   \\"devDependencies\\": {
        +     \\"lerna\\": \\"^999.9.9-e2e.0\\"
        +   }
        + }
        +
        CREATE .gitignore [preview]
        + node_modules/
        lerna WARN The \\"dryRun\\" flag means no changes were made.
        "
      `);

      expect(await fixture.workspaceFileExists("lerna.json")).toBe(false);
      expect(await fixture.workspaceFileExists("package.json")).toBe(false);
      expect(await fixture.workspaceFileExists(".gitignore")).toBe(false);
    });
  });
});
