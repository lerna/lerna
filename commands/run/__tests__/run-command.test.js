"use strict";

jest.mock("@lerna/npm-run-script");

// mocked modules
const npmRunScript = require("@lerna/npm-run-script");
const output = require("@lerna/output");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");

// file under test
const lernaRun = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const ranInPackagesStreaming = testDir =>
  npmRunScript.stream.mock.calls.reduce((arr, [script, { args, npmClient, pkg, prefix }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script, `(prefixed: ${prefix})`].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  npmRunScript.mockImplementation((script, { pkg }) => Promise.resolve({ code: 0, stdout: pkg.name }));
  npmRunScript.stream.mockImplementation(() => Promise.resolve({ code: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe("in a basic repo", () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture("basic");
    });

    it("should complain if invoked with an empty script", async () => {
      try {
        await lernaRun(testDir)("");
      } catch (err) {
        expect(err.message).toBe("You must specify a lifecycle script to run");
      }

      expect.hasAssertions();
    });

    it("runs a script in packages", async () => {
      await lernaRun(testDir)("my-script");

      const logLines = output.logged().split("\n");
      expect(logLines).toContain("package-1");
      expect(logLines).toContain("package-3");
    });

    it("runs a script in packages with --stream", async () => {
      await lernaRun(testDir)("my-script", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("omits package prefix with --stream --no-prefix", async () => {
      await lernaRun(testDir)("my-script", "--stream", "--no-prefix");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("always runs env script", async () => {
      await lernaRun(testDir)("env");

      expect(output.logged().split("\n")).toEqual(["package-1", "package-4", "package-2", "package-3"]);
    });

    it("runs a script only in scoped packages", async () => {
      await lernaRun(testDir)("my-script", "--scope", "package-1");

      expect(output.logged()).toBe("package-1");
    });

    it("does not run a script in ignored packages", async () => {
      await lernaRun(testDir)("my-script", "--ignore", "package-@(2|3|4)");

      expect(output.logged()).toBe("package-1");
    });

    it("does not error when no packages match", async () => {
      await lernaRun(testDir)("missing-script");

      expect(loggingOutput("success")).toContain(
        "No packages found with the lifecycle script 'missing-script'"
      );
    });

    it("runs a script in all packages with --parallel", async () => {
      await lernaRun(testDir)("env", "--parallel");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("omits package prefix with --parallel --no-prefix", async () => {
      await lernaRun(testDir)("env", "--parallel", "--no-prefix");

      expect(ranInPackagesStreaming(testDir)).toMatchSnapshot();
    });

    it("supports alternate npmClient configuration", async () => {
      await lernaRun(testDir)("env", "--npm-client", "yarn");

      expect(output.logged().split("\n")).toEqual(["package-1", "package-4", "package-2", "package-3"]);
    });

    it("reports script errors with early exit", async () => {
      npmRunScript.mockImplementationOnce((script, { pkg }) => {
        const err = new Error(pkg.name);

        err.failed = true;
        err.code = 123;

        return Promise.reject(err);
      });

      try {
        await lernaRun(testDir)("fail");
      } catch (err) {
        expect(err.message).toMatch("package-1");
        expect(err.message).not.toMatch("package-2");
        expect(process.exitCode).toBe(123);
      }

      expect.hasAssertions();
    });

    it("propagates non-zero exit codes with --no-bail", async () => {
      npmRunScript.mockImplementationOnce((script, { pkg }) => {
        const err = new Error(pkg.name);

        err.failed = true;
        err.code = 456;
        err.stdout = pkg.name;

        return Promise.resolve(err);
      });

      await lernaRun(testDir)("my-script", "--no-bail");

      expect(process.exitCode).toBe(456);
      expect(output.logged().split("\n")).toEqual(["package-1", "package-3"]);
    });
  });

  describe("with --include-filtered-dependencies", () => {
    it("runs scoped command including filtered deps", async () => {
      const testDir = await initFixture("include-filtered-dependencies");
      await lernaRun(testDir)(
        "my-script",
        "--scope",
        "@test/package-2",
        "--include-filtered-dependencies",
        "--",
        "--silent"
      );

      const logLines = output.logged().split("\n");
      expect(logLines).toContain("@test/package-1");
      expect(logLines).toContain("@test/package-2");
    });
  });

  describe("with force-local", () => {
    it("runs command in correct order", async () => {
      const testDir = await initFixture("force-local");

      await lernaRun(testDir)("my-script", "--force-local");

      const logLines = output.logged().split("\n");

      expect(logLines[0]).toEqual("package-2");
      expect(logLines[1]).toEqual("package-3");
      expect(logLines[2]).toEqual("package-1");
      expect(logLines[3]).toEqual("package-4");
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("toposort");

      await lernaRun(testDir)("env");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");
      expect(logMessage).toMatch("package-cycle-2 -> package-cycle-1 -> package-cycle-2");
      expect(logMessage).toMatch(
        "package-cycle-extraneous -> package-cycle-1 -> package-cycle-2 -> package-cycle-1"
      );

      expect(output.logged().split("\n")).toEqual([
        "package-dag-1",
        "package-standalone",
        "package-dag-2a",
        "package-dag-2b",
        "package-dag-3",
        "package-cycle-1",
        "package-cycle-2",
        "package-cycle-extraneous",
      ]);
    });

    it("should throw an error with --reject-cycles", async () => {
      const testDir = await initFixture("toposort");

      try {
        await lernaRun(testDir)("env", "--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }

      expect.hasAssertions();
    });
  });
});
