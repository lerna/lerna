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
  updatePackageVersion,
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

const initializeLernaChangedDirectory = async () => {
  createEmptyDirectoryForWorkspace("lerna-changed-test");
  await runLernaInit();
  await runNpmInstall();

  await runCLI("create package-c -y");
  await updatePackageVersion("packages/package-c", "0.0.0-alpha.1");
  await runCLI("create package-b --private -y");

  await addPackagesDirectory("modules");
  await runCLI("create package-a modules -y");
  await runCLI("create package-e modules -y");
  await runCLI("create package-d modules --private -y");

  await addDependencyToPackage("modules/package-a", "package-c", "0.0.0-alpha.1");
  await addDependencyToPackage("packages/package-b", "package-c", "0.0.0-alpha.1");
  await addDependencyToPackage("modules/package-a", "package-d");

  await createInitialGitCommit();
};

describe("lerna changed", () => {
  describe("with no prior release tags", () => {
    beforeAll(() => initializeLernaChangedDirectory());

    afterAll(() => removeWorkspace());

    it("should assume all public packages have changed", async () => {
      const output = await runCLI("changed");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-e
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna info Assuming all packages changed
        lerna success found 3 packages ready to publish

      `);
    });
  });

  describe("with a change to package-c since the last release", () => {
    beforeAll(async () => {
      await initializeLernaChangedDirectory();
      await runCommand("git tag 0.0.0 -m 0.0.0");
      await addDependencyToPackage("packages/package-c", "package-d");
      await runCommand("git add .");
      await runCommand('git commit -m "modify package-c"');
    });

    afterAll(() => removeWorkspace());

    it("should list package-a and package-c as changed", async () => {
      const output = await runCLI("changed");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-a
        package-c
        lerna notice cli v999.9.9-e2e.0
        lerna info Looking for changed packages since 0.0.0
        lerna success found 2 packages ready to publish

      `);
    });

    describe("--json", () => {
      it("should list package-a and package-c as changed in json format", async () => {
        const output = await runCLI("changed --json");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          [
            {
              "name": "package-a",
              "version": "0.0.0",
              "private": false,
              "location": "/tmp/lerna-e2e/lerna-changed-test/modules/package-a"
            },
            {
              "name": "package-c",
              "version": "0.0.0-alpha.1",
              "private": false,
              "location": "/tmp/lerna-e2e/lerna-changed-test/packages/package-c"
            }
          ]
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--ndjson", () => {
      it("should list package-a and package-c as changed in newline-delimited json format", async () => {
        const output = await runCLI("changed --ndjson");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          {"name":"package-a","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-changed-test/modules/package-a"}
          {"name":"package-c","version":"0.0.0-alpha.1","private":false,"location":"/tmp/lerna-e2e/lerna-changed-test/packages/package-c"}
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--all", () => {
      it("should list package-a, package-b, and package-c as changed", async () => {
        const output = await runCLI("changed --all");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          package-a
          package-b (PRIVATE)
          package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("-a", () => {
      it("should list package-a, package-b, and package-c as changed", async () => {
        const output = await runCLI("changed -a");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          package-a
          package-b (PRIVATE)
          package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("--long", () => {
      it("should list package-a and package-c as changed with additional information", async () => {
        const output = await runCLI("changed --long");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          package-a         v0.0.0 modules/package-a
          package-c v0.0.0-alpha.1 packages/package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-l", () => {
      it("should list package-a and package-c as changed with additional information", async () => {
        const output = await runCLI("changed -l");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          package-a         v0.0.0 modules/package-a
          package-c v0.0.0-alpha.1 packages/package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--parseable", () => {
      it("should list package-a and package-c as changed with parseable output instead of columnified view", async () => {
        const output = await runCLI("changed --parseable");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          /tmp/lerna-e2e/lerna-changed-test/modules/package-a
          /tmp/lerna-e2e/lerna-changed-test/packages/package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-p", () => {
      it("should list package-a and package-c as changed with parseable output instead of columnified view", async () => {
        const output = await runCLI("changed -p");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          /tmp/lerna-e2e/lerna-changed-test/modules/package-a
          /tmp/lerna-e2e/lerna-changed-test/packages/package-c
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-pla", () => {
      it("should list package-a, package-b, and package-c as changed, with version and package info, in a parseable output", async () => {
        const output = await runCLI("changed -pla");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          /tmp/lerna-e2e/lerna-changed-test/modules/package-a:package-a:0.0.0
          /tmp/lerna-e2e/lerna-changed-test/packages/package-b:package-b:0.0.0:PRIVATE
          /tmp/lerna-e2e/lerna-changed-test/packages/package-c:package-c:0.0.0-alpha.1
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("--toposort", () => {
      it("should list package-a and package-c as changed, but in topological order", async () => {
        const output = await runCLI("changed --toposort");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          package-c
          package-a
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--graph", () => {
      it("should list package-a and package-c as changed with their dependencies in a json list", async () => {
        const output = await runCLI("changed --graph");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          {
            "package-a": [
              "package-c",
              "package-d"
            ],
            "package-c": [
              "package-d"
            ]
          }
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          lerna success found 2 packages ready to publish

        `);
      });
    });
  });

  describe("--include-merged-tags", () => {
    beforeAll(async () => {
      await initializeLernaChangedDirectory();
      await runCommand("git tag -a 1.0.0 -m 1.0.0");

      await runCommand("git checkout -b changed-package-c");
      await addDependencyToPackage("packages/package-c", "package-d");
      await runCommand("git add .");
      await runCommand('git commit -m "modify package-c"');
      await runCommand("git tag -a 2.0.0 -m 2.0.0");

      await runCommand("git checkout test-main");
      await addDependencyToPackage("modules/package-e", "package-d");
      await runCommand("git add .");
      await runCommand('git commit -m "modify package-e"');

      await runCommand("git merge --no-ff changed-package-c");
    });

    afterAll(() => removeWorkspace());

    it("should list package-e and not package-c when including merged tag from modification to package-c", async () => {
      const output = await runCLI("changed --include-merged-tags");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-e
        lerna notice cli v999.9.9-e2e.0
        lerna info Looking for changed packages since 2.0.0
        lerna success found 1 package ready to publish

      `);
    });
  });
});
