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

describe("lerna-run-nx", () => {
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

  describe("--stream", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.readOutput("stream");

      expect(output).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0

        >  Lerna (powered by Nx)   Running target print-name for 3 projects:

        - package-X
        - package-X
        - package-X



        > package-X:print-name

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X
        package-X: test-package-X

        > package-X:print-name

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X
        package-X: test-package-X

        > package-X:print-name

        package-X: > package-X@0.0.0 print-name
        package-X: > echo test-package-X
        package-X: test-package-X



        >  Lerna (powered by Nx)   Successfully ran target print-name for 3 projects



      `);
    });
  });

  describe("--parallel", () => {
    it("should run script on all child packages with package name prefixes", async () => {
      const output = await fixture.readOutput("parallel");

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
  });

  describe("--no-prefix", () => {
    describe("--parallel", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.readOutput("no-prefix-parallel");

        expect(output).toMatchInlineSnapshot(`
          lerna notice cli v999.9.9-e2e.0
          lerna WARN run "no-prefix" is ignored when not using streaming output.

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

    describe("--stream", () => {
      it("should run script on all child packages and suppress package name prefixes", async () => {
        const output = await fixture.readOutput("no-prefix-stream");

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
    });
  });

  describe("--profile", () => {
    it("should run script on all child packages and create a performance profile", async () => {
      const output = await fixture.readOutput("profile");

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


        Performance Profile: /tmp/lerna-e2e/lerna-run-nx/lerna-workspace/Lerna-Profile-XXXXXXXXTXXXXXX.json

      `);

      const lernaProfileFileName = output.match(/Performance Profile:.*(Lerna-Profile-\w+\.json)/)[1].trim();

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });

    it("should run script on all child packages and create a performance profile at provided location", async () => {
      const output = await fixture.readOutput("profile-custom-location");

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


        Performance Profile: /tmp/lerna-e2e/lerna-run-nx/lerna-workspace/profiles/Lerna-Profile-XXXXXXXXTXXXXXX.json

      `);

      const lernaProfileFileName = output
        .match(/Performance Profile:.*(profiles\/Lerna-Profile-\w+\.json)/)[1]
        .trim();

      expect(existsSync(fixture.getWorkspacePath(lernaProfileFileName))).toBe(true);
    });
  });

  describe("--npm-client", () => {
    it("should error when attempting to use the legacy option", async () => {
      const output = await fixture.readOutput("npm-client-yarn");

      expect(output).toMatchInlineSnapshot(`
        lerna notice cli v999.9.9-e2e.0
        lerna ERR! run The legacy task runner option \`--npm-client\` is not currently supported. Please open an issue on https://github.com/lerna/lerna if you require this feature.

      `);
    });
  });

  describe("--ci", () => {
    it("should log that ci is enabled", async () => {
      const output = await fixture.readOutput("ci");

      expect(output).toContain("lerna info ci enabled");
    });
  });
});
