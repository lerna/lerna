import { Fixture, getPublishedVersion, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeFileSync } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str)
      .replace(/\.+\/\.?pnpm.*\n/g, "")
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

    writeFileSync(
      fixture.getWorkspacePath("package.json"),
      JSON.stringify({
        name: "root",
        private: true,
        devDependencies: {
          lerna: getPublishedVersion(),
        },
      })
    );

    await fixture.install();
  });

  afterEach(() => fixture.destroy());

  it("should set npmClient to pnpm in lerna.json", async () => {
    const result = await fixture.lernaInit("--loglevel verbose");

    expect(result.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info Applying the following file system updates:
      CREATE lerna.json
      UPDATE package.json
      CREATE .gitignore
      lerna info Initializing Git repository
      lerna verb Using pnpm to install packages
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
  });
});
