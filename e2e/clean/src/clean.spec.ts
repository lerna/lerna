import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";
import { existsSync, readdir } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str) {
    return normalizeEnvironment(str);
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-clean", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-clean",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y");

    await fixture.addDependencyToPackage({
      packagePath: "packages/package-a",
      dependencyName: "lodash",
      version: "*",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "lodash",
      version: "*",
    });
  });
  afterAll(() => fixture.destroy());

  it("should remove node_modules for all packages", async () => {
    await fixture.exec("npm install --prefix ./packages/package-a");

    const packageAFiles = await readdir(fixture.getWorkspacePath("packages/package-a/node_modules"));
    expect(packageAFiles.length).toBeGreaterThan(0);

    await fixture.exec("npm install --prefix ./packages/package-b");

    const packageBFiles = await readdir(fixture.getWorkspacePath("packages/package-b/node_modules"));
    expect(packageBFiles.length).toBeGreaterThan(0);

    const output = await fixture.lerna("clean -y");

    const nodeModulesPackageAExists = existsSync(fixture.getWorkspacePath("packages/package-a/node_modules"));
    expect(nodeModulesPackageAExists).toBe(false);

    const nodeModulesPackageBExists = existsSync(fixture.getWorkspacePath("packages/package-b/node_modules"));
    expect(nodeModulesPackageBExists).toBe(false);

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-a/node_modules
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-b/node_modules
      lerna success clean finished

    `);
  });

  it("should remove node_modules for only package-a", async () => {
    await fixture.exec("npm install --prefix ./packages/package-a");

    const packageAFiles = await readdir(fixture.getWorkspacePath("packages/package-a/node_modules"));
    expect(packageAFiles.length).toBeGreaterThan(0);

    await fixture.exec("npm install --prefix ./packages/package-b");

    const packageBFiles = await readdir(fixture.getWorkspacePath("packages/package-b/node_modules"));
    expect(packageBFiles.length).toBeGreaterThan(0);

    const output = await fixture.lerna("clean --scope=package-a -y");

    const nodeModulesPackageAExists = existsSync(fixture.getWorkspacePath("packages/package-a/node_modules"));
    expect(nodeModulesPackageAExists).toBe(false);

    const nodeModulesPackageBExists = existsSync(fixture.getWorkspacePath("packages/package-b/node_modules"));
    expect(nodeModulesPackageBExists).toBe(true);

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter including "package-a"
      lerna info filter [ 'package-a' ]
      lerna info clean removing /tmp/lerna-e2e/lerna-clean/lerna-workspace/packages/package-a/node_modules
      lerna success clean finished

    `);
  });
});
