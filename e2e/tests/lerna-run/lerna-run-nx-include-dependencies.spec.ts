import { remove } from "fs-extra";
import { Fixture } from "../../utils/fixture";
import { normalizeCommandOutput, normalizeEnvironment } from "../../utils/snapshot-serializer-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-include-dependencies", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-nx-include-dependencies",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
      /**
       * Because lerna run involves spawning further child processes, the tests would be too flaky
       * if we didn't force deterministic terminal output by appending stderr to stdout instead
       * of interleaving them.
       */
      forceDeterministicTerminalOutput: true,
    });

    await fixture.lerna("create package-1 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-1",
      scripts: {
        "print-name": "echo test-package-1",
      },
    });
    await fixture.lerna("create package-2 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-2",
      scripts: {
        "print-name": "echo test-package-2",
      },
    });
    await fixture.lerna("create package-3 -y --dependencies package-1 package-2");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "echo test-package-3",
      },
    });

    await fixture.updateJson("lerna.json", (json) => ({
      ...json,
      loglevel: "verbose",
    }));
  });
  afterEach(() => fixture.destroy());

  describe("without nx enabled", () => {
    it("should exclude dependencies by default", async () => {
      // Enable legacy task runner
      await fixture.overrideLernaConfig({
        useNx: false,
      });

      const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 1 package: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
    });
  });

  describe("with nx enabled, but no nx.json", () => {
    it("should exclude dependencies by default", async () => {
      await fixture.addNxJsonToWorkspace();

      await remove(fixture.getWorkspacePath("nx.json"));

      const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 1 package: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
    });
  });

  describe("with nx enabled and with nx.json without targetDefaults", () => {
    it("should exclude dependencies by default", async () => {
      await fixture.addNxJsonToWorkspace();

      const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 1 package: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
    });
  });

  describe("with nx enabled and with nx.json with targetDefaults", () => {
    it("should include package dependencies by default", async () => {
      await fixture.addNxJsonToWorkspace();
      await fixture.updateJson("nx.json", (json) => ({
        ...json,
        targetDefaults: {
          "print-name": {
            dependsOn: ["^print-name"],
          },
        },
      }));
      const output = await fixture.lerna("run print-name --scope package-3");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 1 package: "npm run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
    });

    it("should include package dependencies with --include-dependencies", async () => {
      await fixture.addNxJsonToWorkspace();
      await fixture.updateJson("nx.json", (json) => ({
        ...json,
        targetDefaults: {
          "print-name": {
            dependsOn: ["^print-name"],
          },
        },
      }));

      const output = await fixture.lerna("run print-name --scope package-3 --include-dependencies");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna notice filter including dependencies
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 3 packages: "npm run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });

    it("with --ignore should still include dependencies", async () => {
      await fixture.addNxJsonToWorkspace();
      await fixture.updateJson("nx.json", (json) => ({
        ...json,
        targetDefaults: {
          "print-name": {
            dependsOn: ["^print-name"],
          },
        },
      }));

      const output = await fixture.lerna("run print-name --scope package-3 --ignore package-1");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        > package-X@0.0.0 print-name
        > echo test-package-X

        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna notice filter excluding "package-X"
        lerna info filter [ 'package-X', '!package-X' ]
        lerna info Executing command in 1 package: "npm run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
    });
  });
});
