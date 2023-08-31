import { Fixture, getPublishedVersion, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeFile } from "fs-extra";
import { dump } from "js-yaml";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str)
      .replace(/\.+\/\.?(pnpm|node_modules).*\n/g, "")
      .replace("info cli using local version of lerna\n", "");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-init-pnpm", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-init-pnpm",
      packageManager: "pnpm",
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
          devDependencies: {
            lerna: getPublishedVersion(),
          },
        })
      );

      const pnpmWorkspaceContent = dump({
        packages: ["packages/*", "!**/__test__/**"],
      });
      await writeFile(fixture.getWorkspacePath("pnpm-workspace.yaml"), pnpmWorkspaceContent, "utf-8");

      await fixture.install();
    });

    it("should set npmClient to pnpm in lerna.json", async () => {
      const result = await fixture.lernaInit();

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        UPDATE package.json
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna info Using pnpm to install packages
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started

      `);

      const packageJson = await fixture.readWorkspaceFile("package.json");
      expect(JSON.parse(packageJson).workspaces).toBeUndefined();

      const lernaJson = await fixture.readWorkspaceFile("lerna.json");
      expect(lernaJson).toMatchInlineSnapshot(`
        {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "version": "0.0.0",
          "npmClient": "pnpm"
        }

      `);
    });
  });

  describe("in a new repo", () => {
    it("should generate pnpm-workspace.yaml", async () => {
      const result = await fixture.lernaInit();

      expect(result.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info Applying the following file system updates:
        CREATE lerna.json
        CREATE package.json
        CREATE pnpm-workspace.yaml
        CREATE .gitignore
        lerna info Initializing Git repository
        lerna info Using pnpm to install packages
        lerna success Initialized Lerna files
        lerna info New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started

      `);

      const lernaJson = await fixture.readWorkspaceFile("lerna.json");

      expect(lernaJson).toMatchInlineSnapshot(`
        {
          "$schema": "node_modules/lerna/schemas/lerna-schema.json",
          "version": "0.0.0",
          "npmClient": "pnpm"
        }

      `);

      const packageJson = await fixture.readWorkspaceFile("package.json");
      expect(JSON.parse(packageJson).workspaces).toBeUndefined();

      const pnpmWorkspaceYaml = await fixture.readWorkspaceFile("pnpm-workspace.yaml");
      expect(pnpmWorkspaceYaml).toMatchInlineSnapshot(`
        packages:
          - 'packages/*'

      `);
    });
  });
});
