import { Fixture, normalizeCommitSHAs, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommitSHAs(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-version-independent-pnpm", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-version-independent",
      packageManager: "pnpm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });
  });
  afterEach(() => fixture.destroy());

  it("should support versioning package-b independent of package-a when using the workspace prefix", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y --dependencies package-a");
    await fixture.updateJson("lerna.json", (json) => ({
      ...json,
      version: "independent",
    }));
    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
    await fixture.lerna("version 0.0.0 -y");

    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-a",
      version: "workspace:*",
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: update package-b dependency'");

    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info versioning independent
      lerna info Looking for changed packages since package-a@0.0.0

      Changes:
       - package-b: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });

  it("should support versioning package-a and package-b when using the workspace prefix", async () => {
    await fixture.lerna("create package-a -y");
    await fixture.lerna("create package-b -y --dependencies package-a");
    await fixture.updateJson("lerna.json", (json) => ({
      ...json,
      version: "independent",
    }));
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-a",
      version: "workspace:*",
    });

    await fixture.createInitialGitCommit();
    await fixture.exec("git push origin test-main");
    await fixture.lerna("version 0.0.0 -y");

    await fixture.addDependencyToPackage({
      packagePath: "packages/package-a",
      dependencyName: "yargs",
      version: "*",
    });
    await fixture.exec("git add .");
    await fixture.exec("git commit -m 'chore: update package-a dependency'");

    const output = await fixture.lerna("version 3.3.3 -y");
    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna info versioning independent
      lerna info Looking for changed packages since package-a@0.0.0

      Changes:
       - package-a: 0.0.0 => 3.3.3
       - package-b: 0.0.0 => 3.3.3

      lerna info auto-confirmed 
      lerna info execute Skipping releases
      lerna info git Pushing tags...
      lerna success version finished

    `);
  });
});
