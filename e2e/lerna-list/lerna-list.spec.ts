import {
  addDependencyToPackage,
  addPackagesDirectory,
  createEmptyDirectoryForWorkspace,
  e2eRoot,
  removeWorkspace,
  runCLI,
} from "../utils";

expect.addSnapshotSerializer({
  serialize(str) {
    return str.replaceAll(/\/private\/tmp\//g, "/tmp/").replaceAll(e2eRoot, "/tmp/lerna-e2e");
  },
  test(val) {
    return val != null && typeof val === "string";
  },
});

describe("lerna list", () => {
  afterEach(() => removeWorkspace());

  it("should list public packages in lexicographical order", async () => {
    createEmptyDirectoryForWorkspace("lerna-list-test");
    await runCLI("init");

    await addPackagesDirectory("one");
    await runCLI("create package-b one");
    await runCLI("create package-a one");

    await addPackagesDirectory("two");
    await runCLI("create package-c two");
    await runCLI("create package-d two --private");

    await runCLI("create package-3");

    await addDependencyToPackage("one/package-a", "package-c");
    await addDependencyToPackage("one/package-b", "package-c");

    const output = await runCLI("list");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-a
      package-b
      package-3
      package-c
      lerna notice cli v999.9.9-e2e.0
      lerna success found 4 packages

    `);
  });

  describe("--json", () => {
    it("should list packages json", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --json");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        [
          {
            "name": "package-a",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list-test/modules/package-a"
          },
          {
            "name": "package-b",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list-test/packages/package-b"
          },
          {
            "name": "package-c",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list-test/packages/package-c"
          }
        ]
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--ndjson", () => {
    it("should list packages as newline-delimited json", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --ndjson");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        {"name":"package-a","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/modules/package-a"}
        {"name":"package-b","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/packages/package-b"}
        {"name":"package-c","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/packages/package-c"}
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--all", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --all");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-b (PRIVATE)
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("-a", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list -a");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-b (PRIVATE)
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--long", () => {
    it("should list packages with version and path information", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --long");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a v0.0.0 modules/package-a
        package-c v0.0.0 packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 2 packages

      `);
    });
  });

  describe("-l", () => {
    it("should list packages with version and path information", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list -l");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a v0.0.0 modules/package-a
        package-c v0.0.0 packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 2 packages

      `);
    });
  });

  describe("--parseable", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --parseable");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a
        /tmp/lerna-e2e/lerna-list-test/packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 2 packages

      `);
    });
  });

  describe("-p", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list -p");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a
        /tmp/lerna-e2e/lerna-list-test/packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 2 packages

      `);
    });
  });

  describe("-pla", () => {
    it("should list all packages, with version and package info, in a parseable output", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list -pla");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a:package-a:0.0.0
        /tmp/lerna-e2e/lerna-list-test/packages/package-b:package-b:0.0.0:PRIVATE
        /tmp/lerna-e2e/lerna-list-test/packages/package-c:package-c:0.0.0
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--toposort", () => {
    it("should list packages in topological order", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b");
      await runCLI("create package-a");
      await addPackagesDirectory("modules");
      await runCLI("create package-d modules --private");

      await addDependencyToPackage("packages/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");

      const output = await runCLI("list --toposort");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-c
        package-a
        package-b
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--graph", () => {
    it("should list packages with their dependencies in a json list", async () => {
      createEmptyDirectoryForWorkspace("lerna-list-test");
      await runCLI("init");

      await runCLI("create package-c");
      await runCLI("create package-b --private");

      await addPackagesDirectory("modules");
      await runCLI("create package-a modules");
      await runCLI("create package-d modules --private");

      await addDependencyToPackage("modules/package-a", "package-c");
      await addDependencyToPackage("packages/package-b", "package-c");
      await addDependencyToPackage("modules/package-a", "package-d");

      const output = await runCLI("list --graph");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        {
          "package-a": [
            "package-c",
            "package-d"
          ],
          "package-c": []
        }
        lerna notice cli v999.9.9-e2e.0
        lerna success found 2 packages

      `);
    });

    describe("--all", () => {
      it("should list all packages with their dependencies in a json list", async () => {
        createEmptyDirectoryForWorkspace("lerna-list-test");
        await runCLI("init");

        await runCLI("create package-c");
        await runCLI("create package-b --private");

        await addPackagesDirectory("modules");
        await runCLI("create package-a modules");
        await runCLI("create package-d modules --private");

        await addDependencyToPackage("modules/package-a", "package-c");
        await addDependencyToPackage("packages/package-b", "package-c");
        await addDependencyToPackage("modules/package-a", "package-d");

        const output = await runCLI("list --graph --all");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          {
            "package-a": [
              "package-c",
              "package-d"
            ],
            "package-d": [],
            "package-b": [
              "package-c"
            ],
            "package-c": []
          }
          lerna notice cli v999.9.9-e2e.0
          lerna success found 4 packages

        `);
      });
    });
  });
});
