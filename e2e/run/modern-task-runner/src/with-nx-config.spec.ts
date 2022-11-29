import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
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


      > package-X:print-name


      > package-X:print-name

      > package-X@0.0.0 print-name
      > echo test-package-X
      > package-X@0.0.0 print-name
      > echo test-package-X
      > package-X@0.0.0 print-name
      > echo test-package-X
      test-package-X
      test-package-X
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


      > package-X:"print:name"

      > package-X@0.0.0 print:name
      > echo test-package-X
      > package-X@0.0.0 print:name
      > echo test-package-X
      test-package-X
      test-package-X



      >  Lerna (powered by Nx)   Successfully ran target print:name for 2 projects


      lerna notice cli v999.9.9-e2e.0

    `);
  });
});
