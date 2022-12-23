import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-list", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-list",
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

  it("should list public packages in lexicographical order", async () => {
    const output = await fixture.lerna("list");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      package-a
      package-e
      package-c
      lerna success found 3 packages

    `);
  });

  describe("--json", () => {
    it("should list packages json", async () => {
      const output = await fixture.lerna("list --json");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        [
          {
            "name": "package-a",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-a"
          },
          {
            "name": "package-e",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-e"
          },
          {
            "name": "package-c",
            "version": "0.0.0",
            "private": false,
            "location": "/tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-c"
          }
        ]
        lerna success found 3 packages

      `);
    });
  });

  describe("--ndjson", () => {
    it("should list packages as newline-delimited json", async () => {
      const output = await fixture.lerna("list --ndjson");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        {"name":"package-a","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-a"}
        {"name":"package-e","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-e"}
        {"name":"package-c","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-c"}
        lerna success found 3 packages

      `);
    });
  });

  describe("--all", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      const output = await fixture.lerna("list --all");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-a
        package-d (PRIVATE)
        package-e
        package-b (PRIVATE)
        package-c
        lerna success found 5 packages

      `);
    });
  });

  describe("-a", () => {
    it("should list all packages, including private ones that are hidden by default", async () => {
      const output = await fixture.lerna("list -a");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-a
        package-d (PRIVATE)
        package-e
        package-b (PRIVATE)
        package-c
        lerna success found 5 packages

      `);
    });
  });

  describe("--long", () => {
    it("should list packages with version and path information", async () => {
      const output = await fixture.lerna("list --long");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-a v0.0.0 modules/package-a
        package-e v0.0.0 modules/package-e
        package-c v0.0.0 packages/package-c
        lerna success found 3 packages

      `);
    });
  });

  describe("-l", () => {
    it("should list packages with version and path information", async () => {
      const output = await fixture.lerna("list -l");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-a v0.0.0 modules/package-a
        package-e v0.0.0 modules/package-e
        package-c v0.0.0 packages/package-c
        lerna success found 3 packages

      `);
    });
  });

  describe("--parseable", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      const output = await fixture.lerna("list --parseable");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-a
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-e
        /tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-c
        lerna success found 3 packages

      `);
    });
  });

  describe("-p", () => {
    it("should list packages with parseable output instead of columnified view", async () => {
      const output = await fixture.lerna("list -p");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-a
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-e
        /tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-c
        lerna success found 3 packages

      `);
    });
  });

  describe("-pla", () => {
    it("should list all packages, with version and package info, in a parseable output", async () => {
      const output = await fixture.lerna("list -pla");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-a:package-a:0.0.0
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-d:package-d:0.0.0:PRIVATE
        /tmp/lerna-e2e/lerna-list/lerna-workspace/modules/package-e:package-e:0.0.0
        /tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-b:package-b:0.0.0:PRIVATE
        /tmp/lerna-e2e/lerna-list/lerna-workspace/packages/package-c:package-c:0.0.0
        lerna success found 5 packages

      `);
    });
  });

  describe("--toposort", () => {
    it("should list packages in topological order", async () => {
      const output = await fixture.lerna("list --toposort");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        package-e
        package-c
        package-a
        lerna success found 3 packages

      `);
    });
  });

  describe("--graph", () => {
    it("should list packages with their dependencies in a json list", async () => {
      const output = await fixture.lerna("list --graph");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        {
          "package-a": [
            "package-c",
            "package-d"
          ],
          "package-e": [],
          "package-c": []
        }
        lerna success found 3 packages

      `);
    });

    describe("--all", () => {
      it("should list all packages with their dependencies in a json list", async () => {
        const output = await fixture.lerna("list --graph --all");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
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
          lerna success found 5 packages

        `);
      });
    });
  });
});
