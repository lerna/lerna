import {
  addDependencyToPackage,
  addPackagesDirectory,
  createEmptyDirectoryForWorkspace,
  e2eRoot,
  removeWorkspace,
  runCLI,
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
    createEmptyDirectoryForWorkspace("lerna-list-test");
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

  it("should list public packages in lexicographical order", async () => {
    const output = await runCLI("list");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-a
      package-e
      package-c
      lerna notice cli v999.9.9-e2e.0
      lerna success found 3 packages

    `);
  });

  describe("--json", () => {
    it("should list packages json", async () => {
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
            "name": "package-e",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list-test/modules/package-e"
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
      const output = await runCLI("list --ndjson");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        {"name":"package-a","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/modules/package-a"}
        {"name":"package-e","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/modules/package-e"}
        {"name":"package-c","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list-test/packages/package-c"}
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--all", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      const output = await runCLI("list --all");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-d (PRIVATE)
        package-e
        package-b (PRIVATE)
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 5 packages

      `);
    });
  });

  describe("-a", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      const output = await runCLI("list -a");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-d (PRIVATE)
        package-e
        package-b (PRIVATE)
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 5 packages

      `);
    });
  });

  describe("--long", () => {
    it("should list packages with version and path information", async () => {
      const output = await runCLI("list --long");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a v0.0.0 modules/package-a
        package-e v0.0.0 modules/package-e
        package-c v0.0.0 packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("-l", () => {
    it("should list packages with version and path information", async () => {
      const output = await runCLI("list -l");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a v0.0.0 modules/package-a
        package-e v0.0.0 modules/package-e
        package-c v0.0.0 packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--parseable", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      const output = await runCLI("list --parseable");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a
        /tmp/lerna-e2e/lerna-list-test/modules/package-e
        /tmp/lerna-e2e/lerna-list-test/packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("-p", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      const output = await runCLI("list -p");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a
        /tmp/lerna-e2e/lerna-list-test/modules/package-e
        /tmp/lerna-e2e/lerna-list-test/packages/package-c
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("-pla", () => {
    it("should list all packages, with version and package info, in a parseable output", async () => {
      const output = await runCLI("list -pla");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        /tmp/lerna-e2e/lerna-list-test/modules/package-a:package-a:0.0.0
        /tmp/lerna-e2e/lerna-list-test/modules/package-d:package-d:0.0.0:PRIVATE
        /tmp/lerna-e2e/lerna-list-test/modules/package-e:package-e:0.0.0
        /tmp/lerna-e2e/lerna-list-test/packages/package-b:package-b:0.0.0:PRIVATE
        /tmp/lerna-e2e/lerna-list-test/packages/package-c:package-c:0.0.0
        lerna notice cli v999.9.9-e2e.0
        lerna success found 5 packages

      `);
    });
  });

  describe("--toposort", () => {
    it("should list packages in topological order", async () => {
      const output = await runCLI("list --toposort");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-e
        package-c
        package-a
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });
  });

  describe("--graph", () => {
    it("should list packages with their dependencies in a json list", async () => {
      const output = await runCLI("list --graph");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        {
          "package-a": [
            "package-c",
            "package-d"
          ],
          "package-e": [],
          "package-c": []
        }
        lerna notice cli v999.9.9-e2e.0
        lerna success found 3 packages

      `);
    });

    describe("--all", () => {
      it("should list all packages with their dependencies in a json list", async () => {
        const output = await runCLI("list --graph --all");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          {
            "package-a": [
              "package-c",
              "package-d"
            ],
            "package-d": [],
            "package-e": [],
            "package-b": [
              "package-c"
            ],
            "package-c": []
          }
          lerna notice cli v999.9.9-e2e.0
          lerna success found 5 packages

        `);
      });
    });
  });
});
