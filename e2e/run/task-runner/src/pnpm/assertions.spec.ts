import { Fixture, normalizeCommandOutput, normalizeEnvironment } from "@lerna/e2e-utils";

expect.addSnapshotSerializer({
  serialize(str: string) {
    return normalizeCommandOutput(normalizeEnvironment(str))
      .replaceAll(/package-X\w/g, "package-X")
      .replaceAll(/lerna-run-pnpm-\d*\//g, "lerna-run-pnpm-XXXXXXXX/");
  },
  test(val: string) {
    return val != null && typeof val === "string";
  },
});

describe("lerna-run-nx-pnpm", () => {
  const fixtureRootPath = process.env.FIXTURE_ROOT_PATH;
  let fixture: Fixture;

  beforeAll(() => {
    if (!fixtureRootPath) {
      throw new Error("FIXTURE_ROOT_PATH environment variable is not set");
    }
    fixture = Fixture.fromExisting(process.env.E2E_ROOT, fixtureRootPath);
  });

  afterAll(() => fixture.destroy());

  it("should run script on all child packages", async () => {
    const output = await fixture.readOutput("print-name");

    expect(output).toMatchInlineSnapshot(`
      lerna notice cli v999.9.9-e2e.0

      >  Lerna (powered by Nx)   Running target print-name for 12 projects:

      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-X
      - package-app



      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-X:print-name


      > package-X@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-X
      > echo test-package-X

      test-package-X

      > package-app:print-name


      > package-app@1.0.0 print-name /tmp/lerna-e2e/lerna-run-pnpm-XXXXXXXX/lerna-workspace/packages/package-app
      > echo test-package-app

      test-package-app



      >  Lerna (powered by Nx)   Successfully ran target print-name for 12 projects



    `);
  });
});
