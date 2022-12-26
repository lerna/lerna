import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str));
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-include-dependencies-without-nx-json", () => {
  const fixtureRootPath = process.env.FIXTURE_ROOT_PATH;
  let fixture: Fixture;

  beforeAll(() => {
    if (!fixtureRootPath) {
      throw new Error("FIXTURE_ROOT_PATH environment variable is not set");
    }
    fixture = Fixture.fromExisting(process.env.E2E_ROOT, fixtureRootPath);
  });

  afterAll(() => fixture.destroy());

  it("should exclude dependencies by default", async () => {
    const output = await fixture.readOutput("print-name-package-3");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0
      lerna verb rootPath /tmp/lerna-e2e/lerna-run-nx-include-dependencies-without-nx-json/lerna-workspace
      lerna notice filter including "package-X"
      lerna info filter [ 'package-X' ]
      lerna verb run Nx target configuration was not found. Task dependencies will not be automatically included.

      > package-X:print-name

      > package-X@0.0.0 print-name
      > echo test-package-X
      test-package-X



      >  Lerna (powered by Nx)   Successfully ran target print-name for project package-X



    `);
  });
});
