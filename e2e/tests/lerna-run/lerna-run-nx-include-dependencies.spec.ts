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
      await fixture.addNxToWorkspace();

      await remove(fixture.getWorkspacePath("nx.json"));

      const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        > package-X:print-name --silent

        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        test-package-X --silent

         

         >  Lerna (powered by Nx)   Successfully ran target print-name for project package-X


        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna verb run nx.json was not found. Task dependencies will not be automatically included.

      `);
    });
  });

  describe("with nx enabled and with nx.json", () => {
    it("should not include package dependencies by default", async () => {
      await fixture.addNxToWorkspace();

      const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

> package-X:print-name --silent

> package-X@0.0.0 print-name
> echo test-package-X "--silent"
test-package-X --silent

 

 >  Lerna (powered by Nx)   Successfully ran target print-name for project package-X


lerna notice cli v999.9.9-e2e.0
lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
lerna notice filter including "package-X"
lerna info filter [ 'package-X' ]
lerna verb run nx.json was found. Task dependencies will be automatically included.

`);
    });

    it("should include package dependencies with --include-dependencies", async () => {
      await fixture.addNxToWorkspace();

      const output = await fixture.lerna("run print-name --scope package-3 --include-dependencies");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

 >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

    - package-X
    - package-X
    - package-X

 

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

> package-X:print-name


> package-X@0.0.0 print-name
> echo test-package-X

test-package-X

 

 >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


lerna notice cli v999.9.9-e2e.0
lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies/lerna-workspace
lerna notice filter including "package-X"
lerna notice filter including dependencies
lerna info filter [ 'package-X' ]
lerna verb run nx.json was found. Task dependencies will be automatically included.
lerna info run Using "include-dependencies" option when nx.json exists will include both task dependencies detected by Nx and project dependencies detected by Lerna. See https://lerna.js.org/docs/recipes/using-lerna-powered-by-nx-to-run-tasks#--include-dependencies for details.

`);
    });
  });
});
