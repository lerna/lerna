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
      test-package-X
      test-package-X
      test-package-X
      lerna notice cli v999.9.9-e2e.0
      lerna info Executing command in 3 packages: "npm run print-name --silent"
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
      lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
      lerna success - package-X
      lerna success - package-X
      lerna success - package-X

    `);
  });

  describe("--stream", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.lerna("run print-name --stream -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });
  });

  describe("--parallel", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.lerna("run print-name --parallel -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        package-X: test-package-X
        package-X: test-package-X
        package-X: test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });
  });

  describe("--no-prefix", () => {
    describe("--parallel", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.lerna("run print-name --no-prefix --parallel -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
          lerna success - package-X
          lerna success - package-X
          lerna success - package-X

        `);
      });
    });

    describe("--stream", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.lerna("run print-name --no-prefix --stream -- --silent");

        expect(output.combinedOutput).toMatchInlineSnapshot(`
          test-package-X
          test-package-X
          test-package-X
          lerna notice cli v999.9.9-e2e.0
          lerna info Executing command in 3 packages: "npm run print-name --silent"
          lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
          lerna success - package-X
          lerna success - package-X
          lerna success - package-X

        `);
      });
    });
  });

  describe("--profile", () => {
    it("should run script on all child packages and create a performance profile", async () => {
      const output = await fixture.lerna("run print-name --profile -- --silent");

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-run/lerna-workspace/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

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
        test-package-X
        test-package-X
        test-package-X
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "npm run print-name --silent"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info profiler Performance profile saved to /tmp/lerna-e2e/lerna-run/lerna-workspace/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);

      const lernaProfileSavedOutputLine = output.combinedOutput.split("\n")[8];

      const lernaProfileFileName = lernaProfileSavedOutputLine.split("lerna-run/lerna-workspace/")[1];

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--npm-client", () => {
    it("should run script on all child packages using yarn", async () => {
      const output = await fixture.lerna(`run print-name --npm-client=yarn`);

      expect(output.combinedOutput).toMatchInlineSnapshot(`
        yarn run v1.22.10
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        yarn run v1.22.10
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        yarn run v1.22.10
        $ echo test-package-X
        test-package-X
        Done in X.Xs.
        lerna notice cli v999.9.9-e2e.0
        lerna info Executing command in 3 packages: "yarn run print-name"
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
        lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
        lerna success - package-X
        lerna success - package-X
        lerna success - package-X

      `);
    });

    it("should run script on all child packages using npm", async () => {
      const output = await fixture.lerna(`run print-name --npm-client=npm`);

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
  });

  describe("--ci", () => {
    it("should log that ci is enabled", async () => {
      const output = await fixture.lerna(`run print-name --ci`);

      expect(output.combinedOutput).toContain("lerna info ci enabled");
    });
  });
});

describe("useNx", () => {
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

    await fixture.addNxToWorkspace();

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

describe("--no-bail", () => {
  let fixture: Fixture;

  beforeAll(async () => {
    fixture = await Fixture.create({
      name: "lerna-run-no-bail",
      packageManager: "npm",
      initializeGit: true,
      runLernaInit: true,
      installDependencies: true,
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
        "print-name": "exit 100",
      },
    });
  });
  afterAll(() => fixture.destroy());

  it("should run script on all child packages and throw, but not abort, on script failure", async () => {
    await expect(fixture.lerna("run print-name --no-bail -- --silent")).rejects
      .toThrowErrorMatchingInlineSnapshot(`
            Command failed: npx --offline --no lerna run print-name --no-bail -- --silent
            lerna notice cli v999.9.9-e2e.0
            lerna info Executing command in 3 packages: "npm run print-name --silent"
            lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
            lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
            lerna info run Ran npm script 'print-name' in 'package-X' in X.Xs:
            lerna ERR! Received non-zero exit code 100 during execution
            lerna success run Ran npm script 'print-name' in 3 packages in X.Xs:
            lerna success - package-X
            lerna success - package-X
            lerna success - package-X

          `);
  });
});
