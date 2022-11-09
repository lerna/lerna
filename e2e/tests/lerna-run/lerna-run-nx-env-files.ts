import { remove, writeFile } from "fs-extra";
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

describe("lerna-run-nx-env-files", () => {
  let fixture: Fixture;

  beforeEach(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-nx-env-files",
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
  });
  afterEach(() => fixture.destroy());

  describe("without nx enabled", () => {
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

  describe("with nx enabled", () => {
    it("should log a value by default", async () => {
      await fixture.addNxJsonToWorkspace();

      const output = await fixture.lerna("run log-env-var -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        >  Lerna (powered by Nx)   Nx didn't recognize the following args: loadDotEnvFiles

        When using '--' all executor args have to be defined after '--'.


        > package-X:log-env-var --silent

        > package-X@0.0.0 log-env-var
        > echo $SOMETHING_IN_ENV_FILE "--silent"
        some_value_here --silent



        >  Lerna (powered by Nx)   Successfully ran target log-env-var for project package-X


        lerna notice cli v999.9.9-e2e.0

      `);
    });

    it("should log an empty value when --load-env-files=false", async () => {
      await fixture.addNxJsonToWorkspace();

      const output = await fixture.lerna("run log-env-var --load-env-files=false -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        >  Lerna (powered by Nx)   Nx didn't recognize the following args: loadDotEnvFiles

        When using '--' all executor args have to be defined after '--'.


        > package-X:log-env-var --silent

        > package-X@0.0.0 log-env-var
        > echo $SOMETHING_IN_ENV_FILE "--silent"
        --silent



        >  Lerna (powered by Nx)   Successfully ran target log-env-var for project package-X


        lerna notice cli v999.9.9-e2e.0

      `);
    });
  });
});
