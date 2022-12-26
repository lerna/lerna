import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-with-nx-config", () => {
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
    const output = await fixture.readOutput("all-child-packages");

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

  it("should run script with colon on all child package using nx", async () => {
    const output = await fixture.readOutput("all-packages-colon");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      >  Lerna (powered by Nx)   Running target print:name for 2 projects:

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



    `);
  });

  describe("run one", () => {
    it("should run script on single child package using nx", async () => {
      const output = await fixture.readOutput("single-package");

      expect(output).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0

        > package-X:print-name-run-one-only

        > package-X@0.0.0 print-name-run-one-only
        > echo test-package-X-run-one-only
        test-package-X-run-one-only



        >  Lerna (powered by Nx)   Successfully ran target print-name-run-one-only for project package-X



      `);
    });

    it("should run script with colon on single child package using nx", async () => {
      const output = await fixture.readOutput("single-package-colon");

      expect(output).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0

        > package-X:"print:name:run-one-only"

        > package-X@0.0.0 print:name:run-one-only
        > echo test-package-X-run-one-only-with-colon
        test-package-X-run-one-only-with-colon



        >  Lerna (powered by Nx)   Successfully ran target print:name:run-one-only for project package-X



      `);
    });
  });
});
