"use strict";

const path = require("path");
const log = require("npmlog");

// mocked modules
const npmRunScript = require("../src/utils/npm-run-script");
const output = require("../src/utils/output");
const UpdatedPackagesCollector = require("../src/UpdatedPackagesCollector");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");
const yargsRunner = require("./helpers/yargsRunner");

// file under test
const commandModule = require("../src/commands/RunCommand");

const run = yargsRunner(commandModule);

jest.mock("../src/utils/output");
jest.mock("../src/utils/npm-run-script");

// silence logs
log.level = "silent";

const ranInPackages = testDir =>
  npmRunScript.mock.calls.reduce((arr, [script, { args, npmClient, pkg }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

const ranInPackagesStreaming = testDir =>
  npmRunScript.stream.mock.calls.reduce((arr, [script, { args, npmClient, pkg }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  npmRunScript.mockImplementation(callsBack(null, "stdout"));
  npmRunScript.stream.mockImplementation(callsBack());

  afterEach(jest.clearAllMocks);

  describe("in a basic repo", () => {
    let testDir;
    let lernaRun;

    beforeAll(async () => {
      testDir = await initFixture("RunCommand/basic");
      lernaRun = run(testDir);
    });

    it("runs a script in packages", async () => {
      await lernaRun("my-script");

      expect(ranInPackages(testDir)).toMatchSnapshot();
      expect(output).lastCalledWith("stdout");
    });

    it("runs a script in packages with --stream", async () => {
      await lernaRun("my-script", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("always runs env script", async () => {
      await lernaRun("env");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("runs a script only in scoped packages", async () => {
      await lernaRun("my-script", "--scope", "package-1");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("does not run a script in ignored packages", async () => {
      await lernaRun("my-script", "--ignore", "package-@(2|3|4)");

      expect(ranInPackages(testDir)).toMatchSnapshot();
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

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("does not error when no packages match", async () => {
      await lernaRun("missing-script");

      expect(npmRunScript).not.toBeCalled();
      expect(output).not.toBeCalled();
    });

    it("runs a script in all packages with --parallel", async () => {
      await lernaRun("env", "--parallel");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("supports alternate npmClient configuration", async () => {
      await lernaRun("env", "--npm-client", "yarn");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("runs scoped command including filtered deps", async () => {
      const testDir = await initFixture("RunCommand/include-filtered-dependencies");
      const lernaRun = run(testDir);
      await lernaRun("my-script", "--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("PackageUtilities/toposort");
      let logMessage = null;

      log.once("log.warn", e => {
        logMessage = e.message;
      });

      await run(testDir)("env");

      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");
      expect(logMessage).toMatch("package-cycle-2 -> package-cycle-1 -> package-cycle-2");
      expect(logMessage).toMatch(
        "package-cycle-extraneous -> package-cycle-1 -> package-cycle-2 -> package-cycle-1"
      );

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("should throw an error with --reject-cycles", async () => {
      expect.assertions(1);

      try {
        const testDir = await initFixture("PackageUtilities/toposort");

        await run(testDir)("env", "--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
