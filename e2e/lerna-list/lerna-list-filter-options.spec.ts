import {
  addDependencyToPackage,
  addPackagesDirectory,
  createEmptyDirectoryForWorkspace,
  createInitialGitCommit,
  e2eRoot,
  removeWorkspace,
  runCLI,
  runCommand,
  runLernaInit,
  runNpmInstall,
} from "../utils";

jest.setTimeout(60000);

expect.addSnapshotSerializer({
  serialize(str) {
    return str
      .replaceAll(/\/private\/tmp\//g, "/tmp/")
      .replaceAll(e2eRoot, "/tmp/lerna-e2e")
      .replaceAll(/lerna info ci enabled\n/g, "");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna list", () => {
  beforeAll(async () => {
    createEmptyDirectoryForWorkspace("lerna-list-filter-options-test");
    await runLernaInit();
    await runNpmInstall();

    await runCLI("create package-c -y");
    await runCLI("create package-b --private -y");

    await addPackagesDirectory("modules");
    await runCLI("create package-a modules -y");
    await runCLI("create package-e modules -y");
    await runCLI("create package-d modules --private -y");

    await addDependencyToPackage("modules/package-a", "package-c");
    await addDependencyToPackage("packages/package-b", "package-c");
    await addDependencyToPackage("modules/package-a", "package-d");
  });

  afterAll(() => removeWorkspace());

  describe("--scope", () => {
    it("should list public packages, narrowed to only those that match the scope glob", async () => {
      const output = await runCLI("list --scope package-[ae]");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-e
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter including "package-[ae]"
        lerna info filter [ 'package-[ae]' ]
        lerna success found 2 packages

      `);
    });
  });

  describe("--ignore", () => {
    it("should list public packages, narrowed to only those that do not match the ignore glob", async () => {
      const output = await runCLI("list --ignore package-[ae]");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter excluding "package-[ae]"
        lerna info filter [ '!package-[ae]' ]
        lerna success found 1 package

      `);
    });
  });

  describe("--no-private", () => {
    it("should list all packages, hiding private ones, even with --all argument", async () => {
      const output = await runCLI("list --all --no-private");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-e
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--include-dependencies", () => {
    it("should list public packages, narrowed to only those that match the scope glob, but with all of their public dependencies", async () => {
      const output = await runCLI("list --scope package-a --include-dependencies");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter including "package-a"
        lerna notice filter including dependencies
        lerna info filter [ 'package-a' ]
        lerna success found 2 packages

      `);
    });
  });
});

describe("lerna list --since", () => {
  beforeEach(async () => {
    createEmptyDirectoryForWorkspace("lerna-list-filter-options-since-test");
    await runLernaInit();
    await runNpmInstall();

    await runCLI("create package-c -y");
    await runCLI("create package-b --private -y");

    await addPackagesDirectory("modules");
    await runCLI("create package-a modules -y");
    await runCLI("create package-e modules -y");
    await runCLI("create package-d modules --private -y");

    await addDependencyToPackage("modules/package-a", "package-c");
    await addDependencyToPackage("packages/package-b", "package-c");
    await addDependencyToPackage("modules/package-a", "package-d");

    await createInitialGitCommit();
  });
  afterEach(() => removeWorkspace());

  it("should list public packages, narrowed to only those that have changed since the given tag", async () => {
    await addDependencyToPackage("modules/package-a", "package-b");
    await runCommand("git add .");
    await runCommand('git commit -m "add package b as dependency of package a"');
    await runCommand("git tag 1.0.0");

    await addDependencyToPackage("modules/package-e", "package-c");
    await runCommand("git add .");
    await runCommand('git commit -m "add package c as dependency of package e"');

    const output = await runCLI("list --since 1.0.0");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-e
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "1.0.0"
      lerna info Looking for changed packages since 1.0.0
      lerna success found 1 package

    `);
  });

  it("should list public packages, narrowed to only those that have changed since the given ref", async () => {
    await runCommand("git checkout -b modify-package-a");
    await addDependencyToPackage("modules/package-a", "package-b");
    await runCommand("git add .");
    await runCommand('git commit -m "add package b as dependency of package a"');

    const output = await runCLI("list --since main");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-a
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "main"
      lerna info Looking for changed packages since main
      lerna success found 1 package

    `);
  });

  it("should list public packages, narrowed to only those that have changed since the given ref and their dependencies", async () => {
    await runCommand("git checkout -b modify-package-c");
    await addDependencyToPackage("packages/package-c", "package-e");
    await runCommand("git add .");
    await runCommand('git commit -m "add package e as dependency of package c"');

    const output = await runCLI("list --since main");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-a
      package-c
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter changed since "main"
      lerna info Looking for changed packages since main
      lerna success found 2 packages

    `);
  });

  describe("--exclude-dependents", () => {
    it("should list public packages, narrowed to only those that have changed, but without their dependents", async () => {
      await runCommand("git checkout -b modify-package-c");
      await addDependencyToPackage("packages/package-c", "package-e");
      await runCommand("git add .");
      await runCommand('git commit -m "add package e as dependency of package c"');

      const output = await runCLI("list --since main --exclude-dependents");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna notice filter changed since "main"
        lerna notice filter excluding dependents
        lerna info Looking for changed packages since main
        lerna success found 1 package

      `);
    });
  });
});
