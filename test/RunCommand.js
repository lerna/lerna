// mocked modules
import NpmUtilities from "../src/NpmUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import exitWithCode from "./helpers/exitWithCode";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";

// file under test
import RunCommand from "../src/commands/RunCommand";

jest.mock("../src/NpmUtilities");

const ranInPackages = (testDir) =>
  NpmUtilities.runScriptInDir.mock.calls.reduce((arr, args) => {
    const script = args[0];
    const params = args[1];
    const dir = normalizeRelativeDir(testDir, args[2]);
    arr.push([dir, script].concat(params).join(" "));
    return arr;
  }, []);

const ranInPackagesStreaming = (testDir) =>
  NpmUtilities.runScriptInPackageStreaming.mock.calls.reduce((arr, args) => {
    const script = args[0];
    const params = args[1];
    const pkg = args[2];
    const dir = normalizeRelativeDir(testDir, pkg.location);
    arr.push([dir, script].concat(params).join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  beforeEach(() => {
    NpmUtilities.runScriptInDir = jest.fn(callsBack());
    NpmUtilities.runScriptInPackageStreaming = jest.fn(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    let testDir;

    beforeAll(() => initFixture("RunCommand/basic").then((dir) => {
      testDir = dir;
    }));

    it("runs a script in packages", (done) => {
      const runCommand = new RunCommand(["my-script"], {}, testDir);

      runCommand.runValidations();
      runCommand.runPreparations();

      runCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ranInPackages(testDir)).toMatchSnapshot("run <script>");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    it("runs a script in packages with --stream", (done) => {
      const runCommand = new RunCommand(["my-script"], {
        stream: true,
      }, testDir);

      runCommand.runValidations();
      runCommand.runPreparations();

      runCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ranInPackagesStreaming(testDir)).toMatchSnapshot("run <script> --stream");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });

    [
      "test",
      "env",
    ].forEach((defaultScript) => {
      it(`always runs ${defaultScript} script`, (done) => {
        const runCommand = new RunCommand([defaultScript], {}, testDir);

        runCommand.runValidations();
        runCommand.runPreparations();

        runCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(ranInPackages(testDir)).toMatchSnapshot(`run ${defaultScript}`);

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });

    // Both of these commands should result in the same outcome
    const filters = [
      { test: "runs a script only in scoped packages", flag: "scope", flagValue: "package-1" },
      { test: "does not run a script in ignored packages", flag: "ignore", flagValue: "package-@(2|3|4)" },
    ];
    filters.forEach((filter) => {
      it(filter.test, (done) => {
        const runCommand = new RunCommand(["my-script"], {
          [filter.flag]: filter.flagValue,
        }, testDir);

        runCommand.runValidations();
        runCommand.runPreparations();

        runCommand.runCommand(exitWithCode(0, (err) => {
          if (err) return done.fail(err);

          try {
            expect(ranInPackages(testDir))
              .toMatchSnapshot(`run <script> --${filter.flag} ${filter.flagValue}`);

            done();
          } catch (ex) {
            done.fail(ex);
          }
        }));
      });
    });
  });

  describe("with --include-filtered-dependencies", () => {
    let testDir;

    beforeAll(() => initFixture("RunCommand/include-filtered-dependencies").then((dir) => {
      testDir = dir;
    }));

    it("runs scoped command including filtered deps", (done) => {
      const runCommand = new RunCommand(["my-script"], {
        scope: "@test/package-2",
        includeFilteredDependencies: true
      }, testDir);

      runCommand.runValidations();
      runCommand.runPreparations();

      runCommand.runCommand(exitWithCode(0, (err) => {
        if (err) return done.fail(err);

        try {
          expect(ranInPackages(testDir))
            .toMatchSnapshot("run <script> --scope @test/package-2 --include-filtered-dependencies");

          done();
        } catch (ex) {
          done.fail(ex);
        }
      }));
    });
  });
});
