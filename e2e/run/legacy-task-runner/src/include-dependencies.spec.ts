import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-legacy-task-runner-include-dependencies", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-run-legacy-task-runner-include-dependencies",
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

  it("should exclude dependencies by default", async () => {
    // Enable legacy task runner
    await fixture.overrideLernaConfig({
      useNx: false,
    });

    const output = await fixture.lerna("run print-name --scope package-3 -- --silent");

    expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna verb rootPath /tmp/lerna-e2e/lerna-run-legacy-task-runner-include-dependencies/lerna-workspace
        lerna notice filter including "package-X"
        lerna info filter [ 'package-X' ]
        lerna info Executing command in 1 package: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 1 package in X.Xs:
        lerna success - package-X

      `);
  });
});
