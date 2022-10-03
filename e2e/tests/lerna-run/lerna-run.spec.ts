import { existsSync } from "fs-extra";
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

describe("lerna-run", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run",
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
    await fixture.lerna("create package-3 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-3",
      scripts: {
        "print-name": "echo test-package-3",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages", async () => {
    const output = await fixture.lerna("run print-name -- --silent");
    expect(output.combinedOutput).toMatchInlineSnapshot(`

                  >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

                  - package-X
                  - package-X
                  - package-X

                  With additional flags:
                  --silent=true



                  > package-X:print-name --silent


                  > package-X@0.0.0 print-name
                  > echo test-package-X "--silent"

                  test-package-X --silent

                  > package-X:print-name --silent


                  > package-X@0.0.0 print-name
                  > echo test-package-X "--silent"

                  test-package-X --silent

                  > package-X:print-name --silent


                  > package-X@0.0.0 print-name
                  > echo test-package-X "--silent"

                  test-package-X --silent



                  >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


                  lerna notice cli v999.9.9-e2e.0

            `);
  });

  describe("--stream", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.lerna("run print-name --stream --concurrency=1 -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

        >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

        - package-X
        - package-X
        - package-X

        With additional flags:
        --silent=true



        > package-X:print-name --silent

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X "--silent"
        package-X: test-package-X --silent

        > package-X:print-name --silent

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X "--silent"
        package-X: test-package-X --silent

        > package-X:print-name --silent

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X "--silent"
        package-X: test-package-X --silent



        >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


        lerna notice cli v999.9.9-e2e.0

      `);
    });
  });

  describe("--parallel", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.lerna("run print-name --parallel -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

                >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

                - package-X
                - package-X
                - package-X

                With additional flags:
                --silent=true



                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent



                >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


                lerna notice cli v999.9.9-e2e.0

            `);
    });
  });

  describe("--no-prefix", () => {
    describe("--parallel", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.lerna("run print-name --no-prefix --parallel -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`

                    >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

                    - package-X
                    - package-X
                    - package-X

                    With additional flags:
                    --silent=true



                    > package-X:print-name --silent


                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"

                    test-package-X --silent

                    > package-X:print-name --silent


                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"

                    test-package-X --silent

                    > package-X:print-name --silent


                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"

                    test-package-X --silent



                    >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


                    lerna notice cli v999.9.9-e2e.0
                    lerna WARN run "no-prefix" is ignored when not using streaming output.

                `);
      });
    });

    describe("--stream", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.lerna("run print-name --no-prefix --concurrency=1 --stream -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`

          >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

          - package-X
          - package-X
          - package-X

          With additional flags:
          --silent=true



          > package-X:print-name --silent

          > package-X@0.0.0 print-name
          > echo test-package-X "--silent"
          test-package-X --silent

          > package-X:print-name --silent

          > package-X@0.0.0 print-name
          > echo test-package-X "--silent"
          test-package-X --silent

          > package-X:print-name --silent

          > package-X@0.0.0 print-name
          > echo test-package-X "--silent"
          test-package-X --silent



          >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


          lerna notice cli v999.9.9-e2e.0

        `);
      });
    });
  });

  describe("--profile", () => {
    it("should run script on all child packages and create a performance profile", async () => {
      const output = await fixture.lerna("run print-name --profile -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`

                >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

                - package-X
                - package-X
                - package-X

                With additional flags:
                --silent=true



                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent



                >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


                Performance Profile: /tmp/lerna-e2e/lerna-run/lerna-workspace/Lerna-Profile-XXXXXXXXTXXXXXX.json
                lerna notice cli v999.9.9-e2e.0

            `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[8];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-run/lerna-workspace/")[1];

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--profile --profile-location", () => {
    it("should run script on all child packages and create a performance profile at provided location", async () => {
      const output = await fixture.lerna(`run print-name --profile --profile-location=profiles -- --silent`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`

                >  Lerna (powered by Nx)   Running target print-name for 3 project(s):

                - package-X
                - package-X
                - package-X

                With additional flags:
                --silent=true



                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent

                > package-X:print-name --silent


                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"

                test-package-X --silent



                >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


                Performance Profile: /tmp/lerna-e2e/lerna-run/lerna-workspace/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
                lerna notice cli v999.9.9-e2e.0

            `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[8];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-run/lerna-workspace/")[1];

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--npm-client", () => {
    it("should error when attempting to use the legacy option", async () => {
      const output = await fixture.lerna(`run print-name --npm-client=yarn`, { silenceError: true });

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna ERR! run The legacy task runner option \`--npm-client\` is not currently supported. Please open an issue on https://github.com/lerna/lerna if you require this feature.

      `);
    });
  });

  describe("--ci", () => {
    it("should log that ci is enabled", async () => {
      const output = await fixture.lerna(`run print-name --ci`);

      expect(output.combinedOutput).toContain("lerna info ci enabled");
    });
  });
});

describe("lerna run with nx config", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-with-nx",
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
    await fixture.lerna("create package-4 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-4",
      scripts: {
        "print:name": "echo test-package-4",
        "print-name-run-one-only": "echo test-package-4-run-one-only",
        "print:name:run-one-only": "echo test-package-4-run-one-only-with-colon",
      },
    });
    await fixture.lerna("create package-5 -y");
    await fixture.addScriptsToPackage({
      packagePath: "packages/package-5",
      scripts: {
        "print:name": "echo test-package-5",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages using nx", async () => {
    const output = await fixture.lerna(`run print-name`);

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

        `);
  });

  describe("run one", () => {
    it("should run script on single child package using nx", async () => {
      const output = await fixture.lerna(`run print-name-run-one-only`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`

                > package-X:print-name-run-one-only

                > package-X@0.0.0 print-name-run-one-only
                > echo test-package-X-run-one-only
                test-package-X-run-one-only



                >  Lerna (powered by Nx)   Successfully ran target print-name-run-one-only for project package-X


                lerna notice cli v999.9.9-e2e.0

            `);
    });

    it("should run script with colon on single child package using nx", async () => {
      const output = await fixture.lerna(`run print:name:run-one-only`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`

                > package-X:"print:name:run-one-only"

                > package-X@0.0.0 print:name:run-one-only
                > echo test-package-X-run-one-only-with-colon
                test-package-X-run-one-only-with-colon



                >  Lerna (powered by Nx)   Successfully ran target print:name:run-one-only for project package-X


                lerna notice cli v999.9.9-e2e.0

            `);
    });
  });

  it("should run script with colon on all child package using nx", async () => {
    const output = await fixture.lerna(`run print:name`);

    expect(output.combinedOutput).toMatchInlineSnapshot(`

            >  Lerna (powered by Nx)   Running target print:name for 2 project(s):

            - package-X
            - package-X



            > package-X:"print:name"


            > package-X@0.0.0 print:name
            > echo test-package-X

            test-package-X

            > package-X:"print:name"


            > package-X@0.0.0 print:name
            > echo test-package-X

            test-package-X



            >  Lerna (powered by Nx)   Successfully ran target print:name for 2 projects


            lerna notice cli v999.9.9-e2e.0

        `);
  });
});
