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

    /**
     * We have to reset this environment variable for these specs because of the fact that we are executing the tests themselves using Nx,
     * and by default it will have already been initialized to true.
     */
    delete process.env.NX_LOAD_DOT_ENV_FILES;
  });
  afterEach(() => fixture.destroy());

  it("should log a value by default", async () => {
    await fixture.addNxJsonToWorkspace();

    const output = await fixture.lerna("run log-env-var -- --silent");

    expect(output.combinedOutput).toMatchInlineSnapshot(`

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

            > package-X:log-env-var --silent

            > package-X@0.0.0 log-env-var
            > echo $SOMETHING_IN_ENV_FILE "--silent"
            --silent



            >  Lerna (powered by Nx)   Successfully ran target log-env-var for project package-X


            lerna notice cli v999.9.9-e2e.0

        `);
  });
});
