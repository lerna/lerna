import { Fixture } from "../../utils/fixture";

describe("lerna init", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: "lerna-init",
      packageManager: "npm",
      initializeGit: false,
      runLernaInit: false,
      installDependencies: false,
    });
  });
  afterEach(() => fixture.destroy());

  it("should initialize a lerna workspace", async () => {
    const output = await fixture.lernaInit();

    expect(output.stderr).toMatchInlineSnapshot(`
      "lerna notice cli v999.9.9-e2e.0
      lerna info Initializing Git repository
      lerna info Creating package.json
      lerna info Creating lerna.json
      lerna info Creating packages directory
      lerna success Initialized Lerna files
      "
    `);

    expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
      "{
        \\"packages\\": [
          \\"packages/*\\"
        ],
        \\"useNx\\": false,
        \\"version\\": \\"0.0.0\\"
      }
      "
    `);
    expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
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
      const output = await fixture.lernaInit("--independent");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
        "{
          \\"packages\\": [
            \\"packages/*\\"
          ],
          \\"useNx\\": false,
          \\"version\\": \\"independent\\"
        }
        "
      `);
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
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
      const output = await fixture.lernaInit("--exact");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
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
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
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
      const output = await fixture.lernaInit("--independent --exact");

      expect(output.stderr).toMatchInlineSnapshot(`
        "lerna notice cli v999.9.9-e2e.0
        lerna info Initializing Git repository
        lerna info Creating package.json
        lerna info Creating lerna.json
        lerna info Creating packages directory
        lerna success Initialized Lerna files
        "
      `);

      expect(await fixture.readWorkspaceFile("lerna.json")).toMatchInlineSnapshot(`
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
      expect(await fixture.readWorkspaceFile("package.json")).toMatchInlineSnapshot(`
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
