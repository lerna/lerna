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

describe("lerna-run-nx-incompatible-options", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-nx-incompatible-options",
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

    await fixture.addNxJsonToWorkspace();
    await fixture.updateJson("nx.json", (json) => ({
      ...json,
      targetDefaults: {
        "print-name": {
          dependsOn: ["^print-name"],
        },
      },
    }));

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
    await fixture.lerna("create package-3 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "echo test-package-3",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages using nx", async () => {
    const output = await fixture.lerna(`run print-name`);

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

  it("--parallel should warn", async () => {
    const output = await fixture.lerna(`run print-name --parallel`);

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: test-package-X
      package-X: test-package-X
      package-X: test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name"
      lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
      lerna success - package-X
      lerna success - package-X
      lerna success - package-X

    `);
  });

  it("--sort should warn", async () => {
    const output = await fixture.lerna(`run print-name --sort`);

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

  it("--no-sort should warn", async () => {
    const output = await fixture.lerna(`run print-name --no-sort`);

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

  it("--include-dependencies should warn", async () => {
    const output = await fixture.lerna(`run print-name --include-dependencies`);

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
      lerna notice filter including dependencies
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
});

describe("lerna-run-nx-incompatible-options without nx.json", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-nx-incompatible-options",
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

    await fixture.addNxJsonToWorkspace();
    await remove(fixture.getWorkspacePath("nx.json"));

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
    await fixture.lerna("create package-3 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "echo test-package-3",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages using nx", async () => {
    const output = await fixture.lerna(`run print-name`);

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

  it("--parallel should not warn", async () => {
    const output = await fixture.lerna(`run print-name --parallel`);

    expect(output.combinedOutput).toMatchInlineSnapshot(`
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: test-package-X
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: > package-X@0.0.0 print-name
      package-X: > echo test-package-X
      package-X: test-package-X
      package-X: test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name"
      lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
      lerna success - package-X
      lerna success - package-X
      lerna success - package-X

    `);
  });

  it("--sort should not warn", async () => {
    const output = await fixture.lerna(`run print-name --sort`);

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

  it("--no-sort should not warn", async () => {
    const output = await fixture.lerna(`run print-name --no-sort`);

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

  it("--include-dependencies should not warn", async () => {
    const output = await fixture.lerna(`run print-name --include-dependencies`);

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
      lerna notice filter including dependencies
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
});
