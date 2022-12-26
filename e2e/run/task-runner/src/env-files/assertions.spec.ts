import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-env-files", () => {
  const fixtureRootPath = process.env.FIXTURE_ROOT_PATH;
  let fixture: Fixture;

  beforeAll(() => {
    if (!fixtureRootPath) {
      throw new Error("FIXTURE_ROOT_PATH environment variable is not set");
    }
    fixture = Fixture.fromExisting(process.env.E2E_ROOT, fixtureRootPath);
  });

  afterAll(() => fixture.destroy());

  it("should log a value by default", async () => {
    const output = await fixture.readOutput("log-env-var");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      > package-X:log-env-var

      > package-X@0.0.0 log-env-var
      > echo $SOMETHING_IN_ENV_FILE
      some_value_here



      >  Lerna (powered by Nx)   Successfully ran target log-env-var for project package-X



    `);
  });

  it("should log an empty value when --load-env-files=false", async () => {
    const output = await fixture.readOutput("log-env-var-load-env-files-false");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      > package-X:log-env-var

      > package-X@0.0.0 log-env-var
      > echo $SOMETHING_IN_ENV_FILE



      >  Lerna (powered by Nx)   Successfully ran target log-env-var for project package-X



    `);
  });
});
