import { Fixture, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeEnvironment(str);
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-changed", () => {
  describe("with no prior release tags", () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-changed-with-no-prior-release-tags",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });

      await fixture.lerna("create package-c -y");
      await fixture.updatePackageVersion({ packagePath: "packages/package-c", newVersion: "0.0.0-alpha.1" });
      await fixture.lerna("create package-b --private -y");

      await fixture.addPackagesDirectory("modules");
      await fixture.lerna("create package-a modules -y");
      await fixture.lerna("create package-e modules -y");
      await fixture.lerna("create package-d modules --private -y");

      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-b",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-d",
        version: "0.0.0",
      });

      await fixture.createInitialGitCommit();
    });
    afterAll(() => fixture.destroy());

    it("should assume all public packages have changed", async () => {
      const output = await fixture.lerna("changed");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info Assuming all packages changed
        package-a
        package-e
        package-c
        lerna success found 3 packages ready to publish

      `);
    });
  });

  describe("with a change to package-c since the last release", () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-changed-with-a-change-to-package-c-since-last-release",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });

      await fixture.lerna("create package-c -y");
      await fixture.updatePackageVersion({ packagePath: "packages/package-c", newVersion: "0.0.0-alpha.1" });
      await fixture.lerna("create package-b --private -y");

      await fixture.addPackagesDirectory("modules");
      await fixture.lerna("create package-a modules -y");
      await fixture.lerna("create package-e modules -y");
      await fixture.lerna("create package-d modules --private -y");

      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-b",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-d",
        version: "0.0.0",
      });

      await fixture.createInitialGitCommit();

      await fixture.exec("git tag 0.0.0 -m 0.0.0");
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-c",
        dependencyName: "package-d",
        version: "0.0.0",
      });
      await fixture.exec("git add .");
      await fixture.exec('git commit -m "modify package-c"');
    });
    afterAll(() => fixture.destroy());

    it("should list package-a and package-c as changed", async () => {
      const output = await fixture.lerna("changed");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info Looking for changed packages since 0.0.0
        package-a
        package-c
        lerna success found 2 packages ready to publish

      `);
    });

    describe("--json", () => {
      it("should list package-a and package-c as changed in json format", async () => {
        const output = await fixture.lerna("changed --json");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          [
            {
              "name": "package-a",
              "version": "0.0.0",
              "private": false,
              "location": "/tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/modules/package-a"
            },
            {
              "name": "package-c",
              "version": "0.0.0-alpha.1",
              "private": false,
              "location": "/tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-c"
            }
          ]
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--ndjson", () => {
      it("should list package-a and package-c as changed in newline-delimited json format", async () => {
        const output = await fixture.lerna("changed --ndjson");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          {"name":"package-a","version":"0.0.0","private":false,"location":"/tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/modules/package-a"}
          {"name":"package-c","version":"0.0.0-alpha.1","private":false,"location":"/tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-c"}
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--all", () => {
      it("should list package-a, package-b, and package-c as changed", async () => {
        const output = await fixture.lerna("changed --all");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          package-a
          package-b (PRIVATE)
          package-c
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("-a", () => {
      it("should list package-a, package-b, and package-c as changed", async () => {
        const output = await fixture.lerna("changed -a");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          package-a
          package-b (PRIVATE)
          package-c
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("--long", () => {
      it("should list package-a and package-c as changed with additional information", async () => {
        const output = await fixture.lerna("changed --long");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          package-a         v0.0.0 modules/package-a
          package-c v0.0.0-alpha.1 packages/package-c
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-l", () => {
      it("should list package-a and package-c as changed with additional information", async () => {
        const output = await fixture.lerna("changed -l");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          package-a         v0.0.0 modules/package-a
          package-c v0.0.0-alpha.1 packages/package-c
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--parseable", () => {
      it("should list package-a and package-c as changed with parseable output instead of columnified view", async () => {
        const output = await fixture.lerna("changed --parseable");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/modules/package-a
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-c
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-p", () => {
      it("should list package-a and package-c as changed with parseable output instead of columnified view", async () => {
        const output = await fixture.lerna("changed -p");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/modules/package-a
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-c
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("-pla", () => {
      it("should list package-a, package-b, and package-c as changed, with version and package info, in a parseable output", async () => {
        const output = await fixture.lerna("changed -pla");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/modules/package-a:package-a:0.0.0
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-b:package-b:0.0.0:PRIVATE
          /tmp/lerna-e2e/lerna-changed-with-a-change-to-package-c-since-last-release/lerna-workspace/packages/package-c:package-c:0.0.0-alpha.1
          lerna success found 3 packages ready to publish

        `);
      });
    });

    describe("--toposort", () => {
      it("should list package-a and package-c as changed, but in topological order", async () => {
        const output = await fixture.lerna("changed --toposort");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          package-c
          package-a
          lerna success found 2 packages ready to publish

        `);
      });
    });

    describe("--graph", () => {
      it("should list package-a and package-c as changed with their dependencies in a json list", async () => {
        const output = await fixture.lerna("changed --graph");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna info Looking for changed packages since 0.0.0
          {
            "package-a": [
              "package-c",
              "package-d"
            ],
            "package-c": [
              "package-d"
            ]
          }
          lerna success found 2 packages ready to publish

        `);
      });
    });
  });

  // the purpose of the --include-merged-tags option is outlined in detail in this PR: https://github.com/lerna/lerna/pull/1712
  describe("--include-merged-tags", () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await Fixture.create({
        e2eRoot: process.env.E2E_ROOT,
        name: "lerna-changed-include-merged-tags",
        packageManager: "npm",
        initializeGit: true,
        runLernaInit: true,
        installDependencies: true,
      });

      await fixture.lerna("create package-c -y");
      await fixture.updatePackageVersion({ packagePath: "packages/package-c", newVersion: "0.0.0-alpha.1" });
      await fixture.lerna("create package-b --private -y");

      await fixture.addPackagesDirectory("modules");
      await fixture.lerna("create package-a modules -y");
      await fixture.lerna("create package-e modules -y");
      await fixture.lerna("create package-d modules --private -y");

      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-b",
        dependencyName: "package-c",
        version: "0.0.0-alpha.1",
      });
      await fixture.addDependencyToPackage({
        packagePath: "modules/package-a",
        dependencyName: "package-d",
        version: "0.0.0",
      });

      await fixture.createInitialGitCommit();

      await fixture.exec("git tag 1.0.0 -m 1.0.0");

      await fixture.exec("git checkout -b changed-package-c");
      await fixture.addDependencyToPackage({
        packagePath: "packages/package-c",
        dependencyName: "package-d",
        version: "0.0.0",
      });
      await fixture.exec("git add .");
      await fixture.exec('git commit -m "modify package-c"');
      await fixture.exec("git tag 2.0.0 -m 2.0.0");

      await fixture.exec("git checkout test-main");
      await fixture.addDependencyToPackage({
        packagePath: "modules/package-e",
        dependencyName: "package-d",
        version: "0.0.0",
      });
      await fixture.exec("git add .");
      await fixture.exec('git commit -m "modify package-e"');

      await fixture.exec("git merge --no-ff changed-package-c");
    });
    afterAll(() => fixture.destroy());

    it("should list package-e and not package-c when including merged tag from modification to package-c", async () => {
      const output = await fixture.lerna("changed --include-merged-tags");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna info Looking for changed packages since 2.0.0
        package-e
        lerna success found 1 package ready to publish

      `);
    });
  });
});
