import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";
import { writeFile } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-legacy-task-runner-env-files", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      e2eRoot: process.env.E2E_ROOT,
      name: "lerna-run-legacy-task-runner-env-files",
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

    await writeFile(fixture.getWorkspacePath(".env"), `SOMETHING_IN_ENV_FILE=some_value_here`, "utf-8");

    await fixture.lerna("create package-1 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-1",
      scripts: {
        "log-env-var": "echo $SOMETHING_IN_ENV_FILE",
      },
    });

    /**
     * We have to reset this environment variable for these specs because of the fact that we are executing the tests themselves using Nx,
     * and by default it will have already been initialized to true.
     */
    delete process.env.NX_LOAD_DOT_ENV_FILES;
  });
  afterEach(() => fixture.destroy());

  it("should log an empty value", async () => {
    // Enable legacy task runner
    await fixture.overrideLernaConfig({
      useNx: false,
    });

    const output = await fixture.lerna("run log-env-var -- --silent");

    expect(output.combinedOutput).toMatchInlineSnapshot(`

        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 1 package: "npm run log-env-var --silent"
        lerna info run Ran npm script 'log-env-var' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'log-env-var' in 1 package in X.Xs:
        lerna success - package-X

      `);
  });
});
