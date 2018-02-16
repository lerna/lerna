"use strict";

jest.mock("../src/utils/npm-run-script");

const path = require("path");

// mocked modules
const npmRunScript = require("../src/utils/npm-run-script");
const UpdatedPackagesCollector = require("../src/UpdatedPackagesCollector");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");
const consoleOutput = require("./helpers/consoleOutput");
const loggingOutput = require("./helpers/loggingOutput");
const normalizeRelativeDir = require("./helpers/normalizeRelativeDir");

// file under test
const lernaRun = require("./helpers/command-runner")(require("../src/commands/RunCommand"));

// assertion helpers
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

  describe("in a basic repo", () => {
    it("runs a script in packages", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("my-script");

      expect(ranInPackages(testDir)).toMatchSnapshot();
      expect(consoleOutput()).toMatch("stdout\nstdout");
    });

    it("runs a script in packages with --stream", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("my-script", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("always runs env script", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("env");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("runs a script only in scoped packages", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("my-script", "--scope", "package-1");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("does not run a script in ignored packages", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("my-script", "--ignore", "package-@(2|3|4)");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("should filter packages that are not updated with --since", async () => {
      const testDir = await initFixture("RunCommand/basic");

      UpdatedPackagesCollector.prototype.getUpdates = jest.fn(() => [
        {
          package: {
            name: "package-3",
            location: path.join(testDir, "packages/package-3"),
            scripts: { "my-script": "echo package-3" },
          },
        },
      ]);

      await lernaRun(testDir)("my-script", "--since");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });

    it("does not error when no packages match", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("missing-script");

      expect(npmRunScript).not.toBeCalled();
      expect(consoleOutput()).toBe("");
    });

    it("runs a script in all packages with --parallel", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("env", "--parallel");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("supports alternate npmClient configuration", async () => {
      const testDir = await initFixture("RunCommand/basic");

      await lernaRun(testDir)("env", "--npm-client", "yarn");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("runs scoped command including filtered deps", async () => {
      const testDir = await initFixture("RunCommand/include-filtered-dependencies");
      await lernaRun(testDir)("my-script", "--scope", "@test/package-2", "--include-filtered-dependencies");

      expect(ranInPackages(testDir)).toMatchSnapshot();
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("PackageUtilities/toposort");

      await lernaRun(testDir)("env");

      const [logMessage] = loggingOutput("warn");
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

      const testDir = await initFixture("PackageUtilities/toposort");

      try {
        await lernaRun(testDir)("env", "--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
