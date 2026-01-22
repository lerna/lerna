import { Fixture, getPublishedVersion, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeFile } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str).replace("info cli using local version of lerna\n", "");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-init-bun", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-init-bun",
      packageManager: "bun",
      initializeGit: false,
      lernaInit: false,
      installDependencies: false,
    });
  });

  afterEach(() => fixture.destroy());

  describe("in an existing repo", () => {
    beforeEach(async () => {
      await writeFile(
        fixture.getWorkspacePath("package.json"),
        JSON.stringify({
          name: "root",
          private: true,
          workspaces: ["packages/*"],
          devDependencies: {
            lerna: getPublishedVersion(),
          },
        })
      );

      await fixture.install();
    });

    it("should set npmClient to bun in lerna.json", async () => {
      const result = await fixture.lernaInit();

      expect(result.combinedOutput).toContain("lerna success Initialized Lerna files");

      const lernaJson = await fixture.readWorkspaceFile("lerna.json");
      expect(lernaJson).toMatchInlineSnapshot(`
        {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "version": "0.0.0",
          "npmClient": "bun"
        }

      `);
    });
  });

  describe("in a new repo", () => {
    it("should create workspaces in package.json", async () => {
      const result = await fixture.lernaInit();

      expect(result.combinedOutput).toContain("lerna success Initialized Lerna files");

      const lernaJson = await fixture.readWorkspaceFile("lerna.json");
      expect(lernaJson).toMatchInlineSnapshot(`
        {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "version": "0.0.0",
          "npmClient": "bun"
        }

      `);

      const packageJson = await fixture.readWorkspaceFile("package.json");
      const parsed = JSON.parse(packageJson);
      expect(parsed.workspaces).toBeDefined();
      expect(parsed.workspaces).toContain("packages/*");
    });
  });
});
