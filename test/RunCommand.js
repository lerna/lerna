import path from "path";
import log from "npmlog";

// mocked modules
import NpmUtilities from "../src/NpmUtilities";
import output from "../src/utils/output";
import UpdatedPackagesCollector from "../src/UpdatedPackagesCollector";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";
import normalizeRelativeDir from "./helpers/normalizeRelativeDir";
import yargsRunner from "./helpers/yargsRunner";

// file under test
import * as commandModule from "../src/commands/RunCommand";

const run = yargsRunner(commandModule);

jest.mock("../src/NpmUtilities");
jest.mock("../src/utils/output");

// silence logs
log.level = "silent";

const ranInPackages = testDir =>
  NpmUtilities.runScriptInDir.mock.calls.reduce((arr, [script, cfg]) => {
    const { args, directory } = cfg;
    const dir = normalizeRelativeDir(testDir, directory);
    arr.push([dir, script].concat(args).join(" "));
    return arr;
  }, []);

const ranInPackagesStreaming = testDir =>
  NpmUtilities.runScriptInPackageStreaming.mock.calls.reduce((arr, [script, cfg]) => {
    const { args, pkg } = cfg;
    const dir = normalizeRelativeDir(testDir, pkg.location);
    arr.push([dir, script].concat(args).join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  beforeEach(() => {
    NpmUtilities.runScriptInDir = jest.fn(callsBack(null, "stdout"));
    NpmUtilities.runScriptInPackageStreaming = jest.fn(callsBack());
  });

  afterEach(() => jest.resetAllMocks());

  describe("in a basic repo", () => {
    let testDir;
    let lernaRun;

    beforeAll(async () => {
      testDir = await initFixture("RunCommand/basic");
      lernaRun = run(testDir);
    });

    it("runs a script in packages", async () => {
      await lernaRun("my-script");

      expect(ranInPackages(testDir)).toMatchSnapshot("run <script>");
      expect(output).lastCalledWith("stdout");
    });

    it("runs a script in packages with --stream", async () => {
      await lernaRun("my-script", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot("run <script> --stream");
    });

    it("always runs env script", async () => {
      await lernaRun("env");

      expect(ranInPackages(testDir)).toMatchSnapshot("run env");
    });

    it("runs a script only in scoped packages", async () => {
      await lernaRun("my-script", "--scope", "package-1");

      expect(ranInPackages(testDir)).toMatchSnapshot(`run <script> --scope package-1`);
    });

    it("does not run a script in ignored packages", async () => {
      await lernaRun("my-script", "--ignore", "package-@(2|3|4)");

      expect(ranInPackages(testDir)).toMatchSnapshot(`run <script> --ignore package-@(2|3|4)`);
    });

    it("should filter packages that are not updated with --since", async () => {
      UpdatedPackagesCollector.prototype.getUpdates = jest.fn(() => [
        {
          package: {
            name: "package-3",
            location: path.join(testDir, "packages/package-3"),
            scripts: { "my-script": "echo package-3" },
          },
        },
      ]);

      await lernaRun("my-script", "--since");

      expect(ranInPackages(testDir)).toMatchSnapshot("run <script> --since");
    });

    it("does not error when no packages match", async () => {
      await lernaRun("missing-script");

      expect(NpmUtilities.runScriptInDir).not.toBeCalled();
      expect(output).not.toBeCalled();
    });

    it("runs a script in all packages with --parallel", async () => {
      await lernaRun("env", "--parallel");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot("run <script> --parallel");
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("runs scoped command including filtered deps", async () => {
      const testDir = await initFixture("RunCommand/include-filtered-dependencies");
      const lernaRun = run(testDir);
      await lernaRun("my-script", "--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(ranInPackages(testDir)).toMatchSnapshot(
        "run <script> --scope @test/package-2 --include-filtered-dependencies"
      );
    });
  });
});
