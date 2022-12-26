import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-incompatible-options", () => {
  const fixtureRootPath = process.env.FIXTURE_ROOT_PATH;
  let fixture: Fixture;

  beforeAll(() => {
    if (!fixtureRootPath) {
      throw new Error("FIXTURE_ROOT_PATH environment variable is not set");
    }
    fixture = Fixture.fromExisting(process.env.E2E_ROOT, fixtureRootPath);
  });

  afterAll(() => fixture.destroy());

  it("should run script on all child packages using nx", async () => {
    const output = await fixture.readOutput(`print-name`);

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      >  Lerna (powered by Nx)   Running target print-name for 3 projects:

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



    `);
  });

  it("--parallel should warn", async () => {
    const output = await fixture.readOutput(`print-name-parallel`);

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna WARN run "parallel", "sort", and "no-sort" are ignored when Nx targets are configured. See https://lerna.js.org/docs/lerna6-obsolete-options for details.

      >  Lerna (powered by Nx)   Running target print-name for 3 projects:

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



    `);
  });

  it("--sort should warn", async () => {
    const output = await fixture.readOutput(`print-name-sort`);

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna WARN run "parallel", "sort", and "no-sort" are ignored when Nx targets are configured. See https://lerna.js.org/docs/lerna6-obsolete-options for details.

      >  Lerna (powered by Nx)   Running target print-name for 3 projects:

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



    `);
  });

  it("--no-sort should warn", async () => {
    const output = await fixture.readOutput(`print-name-no-sort`);

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna WARN run "parallel", "sort", and "no-sort" are ignored when Nx targets are configured. See https://lerna.js.org/docs/lerna6-obsolete-options for details.

      >  Lerna (powered by Nx)   Running target print-name for 3 projects:

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



    `);
  });

  it("--include-dependencies should warn", async () => {
    const output = await fixture.readOutput(`print-name-include-dependencies`);

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter including dependencies
      lerna info run Using the "include-dependencies" option when Nx targets are configured will include both task dependencies detected by Nx and project dependencies detected by Lerna. See https://lerna.js.org/docs/lerna6-obsolete-options#--include-dependencies for details.

      >  Lerna (powered by Nx)   Running target print-name for 3 projects:

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



    `);
  });
});
