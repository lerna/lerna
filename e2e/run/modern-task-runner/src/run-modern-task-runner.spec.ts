import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";
import { existsSync } from "fs-extra";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe.skip("lerna-run-nx", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-nx",
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


            > package-X:print-name --silent


            > package-X:print-name --silent

            > package-X@0.0.0 print-name
            > echo test-package-X "--silent"
            > package-X@0.0.0 print-name
            > echo test-package-X "--silent"
            > package-X@0.0.0 print-name
            > echo test-package-X "--silent"
            test-package-X --silent
            test-package-X --silent
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


                > package-X:print-name --silent


                > package-X:print-name --silent

                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"
                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"
                > package-X@0.0.0 print-name
                > echo test-package-X "--silent"
                test-package-X --silent
                test-package-X --silent
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


                    > package-X:print-name --silent


                    > package-X:print-name --silent

                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"
                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"
                    > package-X@0.0.0 print-name
                    > echo test-package-X "--silent"
                    test-package-X --silent
                    test-package-X --silent
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


        > package-X:print-name --silent


        > package-X:print-name --silent

        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        test-package-X --silent
        test-package-X --silent
        test-package-X --silent



        >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


        Performance Profile: /tmp/lerna-e2e/lerna-run-nx/lerna-workspace/Lerna-Profile-XXXXXXXXTXXXXXX.json
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


        > package-X:print-name --silent


        > package-X:print-name --silent

        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        > package-X@0.0.0 print-name
        > echo test-package-X "--silent"
        test-package-X --silent
        test-package-X --silent
        test-package-X --silent



        >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects


        Performance Profile: /tmp/lerna-e2e/lerna-run-nx/lerna-workspace/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
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
