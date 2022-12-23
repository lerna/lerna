import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-list-filter-options", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-list-filter-options",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-c -y");
    await fixture.lerna("create package-b --private -y");

    await fixture.addPackagesDirectory("modules");
    await fixture.lerna("create package-a modules -y");
    await fixture.lerna("create package-e modules -y");
    await fixture.lerna("create package-d modules --private -y");

    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-c",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-c",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-d",
      version: "0.0.0",
    });
  });
  afterAll(() => fixture.destroy());

  describe("--scope", () => {
    it("should list public packages, narrowed to only those that match the scope glob", async () => {
      const output = await fixture.lerna("list --scope package-[ae]");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter including "package-[ae]"
        lerna info filter [ 'package-[ae]' ]
        package-a
        package-e
        lerna success found 2 packages

      `);
    });
  });

  describe("--ignore", () => {
    it("should list public packages, narrowed to only those that do not match the ignore glob", async () => {
      const output = await fixture.lerna("list --ignore package-[ae]");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter excluding "package-[ae]"
        lerna info filter [ '!package-[ae]' ]
        package-c
        lerna success found 1 package

      `);
    });
  });

  describe("--no-private", () => {
    it("should list all packages, hiding private ones, even with --all argument", async () => {
      const output = await fixture.lerna("list --all --no-private");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-a
        package-e
        package-c
        lerna success found 3 packages

      `);
    });
  });

  describe("--include-dependencies", () => {
    it("should list public packages, narrowed to only those that match the scope glob, but with all of their public dependencies", async () => {
      const output = await fixture.lerna("list --scope package-a --include-dependencies");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter including "package-a"
        lerna notice filter including dependencies
        lerna info filter [ 'package-a' ]
        package-a
        package-c
        lerna success found 2 packages

      `);
    });
  });
});

describe("lerna list --since", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-list-filter-options",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
    });

    await fixture.lerna("create package-c -y");
    await fixture.lerna("create package-b --private -y");

    await fixture.addPackagesDirectory("modules");
    await fixture.lerna("create package-a modules -y");
    await fixture.lerna("create package-e modules -y");
    await fixture.lerna("create package-d modules --private -y");

    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-c",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-b",
      dependencyName: "package-c",
      version: "0.0.0",
    });
    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-d",
      version: "0.0.0",
    });

    await fixture.createInitialGitCommit();
  });
  afterEach(() => fixture.destroy());

  it("should list public packages, narrowed to only those that have changed since the given tag", async () => {
    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-b",
      version: "0.0.0",
    });
    await fixture.exec("git add .");
    await fixture.exec('git commit -m "add package b as dependency of package a"');
    await fixture.exec("git tag 1.0.0");

    await fixture.addDependencyToPackage({
      packagePath: "modules/package-e",
      dependencyName: "package-c",
      version: "0.0.0",
    });
    await fixture.exec("git add .");
    await fixture.exec('git commit -m "add package c as dependency of package e"');

    const output = await fixture.lerna("list --since 1.0.0");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "1.0.0"
      lerna info Looking for changed packages since 1.0.0
      package-e
      lerna success found 1 package

    `);
  });

  it("should list public packages, narrowed to only those that have changed since the given ref", async () => {
    await fixture.exec("git checkout -b modify-package-a");
    await fixture.addDependencyToPackage({
      packagePath: "modules/package-a",
      dependencyName: "package-b",
      version: "0.0.0",
    });
    await fixture.exec("git add .");
    await fixture.exec('git commit -m "add package b as dependency of package a"');

    const output = await fixture.lerna("list --since test-main");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "test-main"
      lerna info Looking for changed packages since test-main
      package-a
      lerna success found 1 package

    `);
  });

  it("should list public packages, narrowed to only those that have changed since the given ref and their dependencies", async () => {
    await fixture.exec("git checkout -b modify-package-c");
    await fixture.addDependencyToPackage({
      packagePath: "packages/package-c",
      dependencyName: "package-e",
      version: "0.0.0",
    });
    await fixture.exec("git add .");
    await fixture.exec('git commit -m "add package e as dependency of package c"');

    const output = await fixture.lerna("list --since test-main");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "test-main"
      lerna info Looking for changed packages since test-main
      package-a
      package-c
      lerna success found 2 packages

    `);
  });

  describe("--exclude-dependents", () => {
    it("should list public packages, narrowed to only those that have changed, but without their dependents", async () => {
      await fixture.exec("git checkout -b modify-package-c");
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-c",
        dependencyName: "package-e",
        version: "0.0.0",
      });
      await fixture.exec("git add .");
      await fixture.exec('git commit -m "add package e as dependency of package c"');

      const output = await fixture.lerna("list --since test-main --exclude-dependents");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter changed since "test-main"
        lerna notice filter excluding dependents
        lerna info Looking for changed packages since test-main
        package-c
        lerna success found 1 package

      `);
    });
  });
});
