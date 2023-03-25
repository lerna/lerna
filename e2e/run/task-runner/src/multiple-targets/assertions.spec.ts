import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return (
      normalizeCommandOutput(normalizeEnvironment(str))
        // Normalize the script names in the output otherwise it will be non-deterministic
        .replaceAll("print-name-again", "XXXXXXXXXX")
        .replaceAll("print-name", "XXXXXXXXXX")
    );
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-multiple-targets", () => {
  const fixtureRootPath = process.env.FIXTURE_ROOT_PATH;
  let fixture: Fixture;

  beforeAll(() => {
    if (!fixtureRootPath) {
      throw new Error("FIXTURE_ROOT_PATH environment variable is not set");
    }
    fixture = Fixture.fromExisting(process.env.E2E_ROOT, fixtureRootPath);
  });

  afterAll(() => fixture.destroy());

  it("should run multiple comma-delimited targets concurrently", async () => {
    const output = await fixture.readOutput("multiple-targets");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      >  Lerna (powered by Nx)   Running targets XXXXXXXXXX, XXXXXXXXXX for 3 projects:

      - package-X
      - package-X
      - package-X



      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X

      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X

      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X

      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X



      >  Lerna (powered by Nx)   Successfully ran targets XXXXXXXXXX, XXXXXXXXXX for 3 projects



    `);
  });

  it("should run multiple comma-delimited targets concurrently for a single package", async () => {
    const output = await fixture.readOutput("multiple-targets-single-package");
    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna notice filter including "package-X"
      lerna info filter [ 'package-X' ]

      >  Lerna (powered by Nx)   Running targets XXXXXXXXXX, XXXXXXXXXX for project package-X:

      - package-X



      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X

      > package-X:XXXXXXXXXX


      > package-X@0.0.0 XXXXXXXXXX
      > echo test-package-X

      test-package-X



      >  Lerna (powered by Nx)   Successfully ran targets XXXXXXXXXX, XXXXXXXXXX for project package-X



    `);
  });
});
