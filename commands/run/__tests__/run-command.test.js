"use strict";

jest.mock("@lerna/npm-run-script");

const fs = require("fs-extra");
const globby = require("globby");

// mocked modules
const { npmRunScript, npmRunScriptStreaming } = require("@lerna/npm-run-script");
const { output } = require("@lerna/output");

// helpers
const initFixture = require("@lerna-test/helpers").initFixtureFactory(__dirname);
const { loggingOutput } = require("@lerna-test/helpers/logging-output");
const { normalizeRelativeDir } = require("@lerna-test/helpers");
const { afterEach, afterAll } = require("jest-circus");

// file under test
const lernaRun = require("@lerna-test/helpers").commandRunner(require("../command"));

// assertion helpers
const ranInPackagesStreaming = (testDir) =>
  npmRunScriptStreaming.mock.calls.reduce((arr, [script, { args, npmClient, pkg, prefix }]) => {
    const dir = normalizeRelativeDir(testDir, pkg.location);
    const record = [dir, npmClient, "run", script, `(prefixed: ${prefix})`].concat(args);
    arr.push(record.join(" "));
    return arr;
  }, []);

describe("RunCommand", () => {
  npmRunScript.mockImplementation((script, { pkg }) => Promise.resolve({ exitCode: 0, stdout: pkg.name }));
  npmRunScriptStreaming.mockImplementation(() => Promise.resolve({ exitCode: 0 }));

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
      const command = lernaRun(testDir)("");

      await expect(command).rejects.toThrow("You must specify a lifecycle script to run");
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
        err.exitCode = 123;

        return Promise.reject(err);
      });

      const command = lernaRun(testDir)("fail");

      await expect(command).rejects.toThrow("package-1");
      expect(process.exitCode).toBe(123);
    });

    it("propagates non-zero exit codes with --no-bail", async () => {
      npmRunScript.mockImplementationOnce((script, { pkg }) => {
        const err = new Error(pkg.name);

        err.failed = true;
        err.exitCode = 456;
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

  describe("with --profile", () => {
    it("executes a profiled command in all packages", async () => {
      const cwd = await initFixture("basic");

      await lernaRun(cwd)("--profile", "my-script");

      const [profileLocation] = await globby("Lerna-Profile-*.json", { cwd, absolute: true });
      const json = await fs.readJson(profileLocation);

      expect(json).toMatchObject([
        {
          name: "package-1",
          ph: "X",
          ts: expect.any(Number),
          pid: 1,
          tid: expect.any(Number),
          dur: expect.any(Number),
        },
        {
          name: "package-3",
        },
      ]);
    });

    it("accepts --profile-location", async () => {
      const cwd = await initFixture("basic");

      await lernaRun(cwd)("--profile", "--profile-location", "foo/bar", "my-script");

      const [profileLocation] = await globby("foo/bar/Lerna-Profile-*.json", { cwd, absolute: true });
      const exists = await fs.exists(profileLocation);

      expect(exists).toBe(true);
    });
  });

  describe("with --no-sort", () => {
    it("runs scripts in lexical (not topological) order", async () => {
      const testDir = await initFixture("toposort");

      await lernaRun(testDir)("env", "--concurrency", "1", "--no-sort");

      expect(output.logged().split("\n")).toEqual([
        "package-cycle-1",
        "package-cycle-2",
        "package-cycle-extraneous-1",
        "package-cycle-extraneous-2",
        "package-dag-1",
        "package-dag-2a",
        "package-dag-2b",
        "package-dag-3",
        "package-standalone",
      ]);
    });

    it("optionally streams output", async () => {
      const testDir = await initFixture("toposort");

      await lernaRun(testDir)("env", "--concurrency", "1", "--no-sort", "--stream");

      expect(ranInPackagesStreaming(testDir)).toMatchInlineSnapshot(`
        Array [
          "packages/package-cycle-1 npm run env (prefixed: true)",
          "packages/package-cycle-2 npm run env (prefixed: true)",
          "packages/package-cycle-extraneous-1 npm run env (prefixed: true)",
          "packages/package-cycle-extraneous-2 npm run env (prefixed: true)",
          "packages/package-dag-1 npm run env (prefixed: true)",
          "packages/package-dag-2a npm run env (prefixed: true)",
          "packages/package-dag-2b npm run env (prefixed: true)",
          "packages/package-dag-3 npm run env (prefixed: true)",
          "packages/package-standalone npm run env (prefixed: true)",
        ]
      `);
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("toposort");

      await lernaRun(testDir)("env", "--concurrency", "1");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");

      expect(output.logged().split("\n")).toEqual([
        "package-dag-1",
        "package-standalone",
        "package-dag-2a",
        "package-dag-2b",
        "package-cycle-1",
        "package-cycle-2",
        "package-dag-3",
        "package-cycle-extraneous-1",
        "package-cycle-extraneous-2",
      ]);
    });

    it("works with intersected cycles", async () => {
      const testDir = await initFixture("cycle-intersection");

      await lernaRun(testDir)("env", "--concurrency", "1");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("b -> c -> d -> e -> b");
      expect(logMessage).toMatch("f -> g -> (nested cycle: b -> c -> d -> e -> b) -> f");

      expect(output.logged().split("\n")).toEqual(["f", "b", "e", "d", "c", "g", "a"]);
    });

    it("works with separate cycles", async () => {
      const testDir = await initFixture("cycle-separate");

      await lernaRun(testDir)("env", "--concurrency", "1");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("b -> c -> d -> b");
      expect(logMessage).toMatch("e -> f -> g -> e");

      expect(output.logged().split("\n")).toEqual(["e", "g", "f", "h", "b", "d", "c", "a"]);
    });

    it("should throw an error with --reject-cycles", async () => {
      const testDir = await initFixture("toposort");
      const command = lernaRun(testDir)("env", "--reject-cycles");

      await expect(command).rejects.toThrow("Dependency cycles detected, you should fix these!");
    });
  });

  // this is a temporary set of tests, which will be replaced by verdacio-driven tests
  // once the required setup is fully set up
  describe("in a repo powered by Nx", () => {
    let testDir;
    let collectedOutput = "";
    let originalStdout;

    beforeAll(async () => {
      testDir = await initFixture("powered-by-nx");
      process.env.NX_WORKSPACE_ROOT_PATH = testDir;
      jest.spyOn(process, "exit").mockImplementation((code) => {
        if (code !== 0) {
          throw new Error();
        }
      });
      originalStdout = process.stdout.write;
      process.stdout.write = (v) => {
        collectedOutput = `${collectedOutput}\n${v}`;
      };
    });

    afterAll(() => {
      process.stdout.write = originalStdout;
    });

    it("runs a script in packages", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("my-script");
      expect(collectedOutput).toContain("package-1");
      expect(collectedOutput).toContain("package-3");
      expect(collectedOutput).toContain("Successfully ran target");
    });

    it("runs a script with a colon in the script name", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("another-script:but-with-colons");
      expect(collectedOutput).toContain("package-1-script-with-colons");
      expect(collectedOutput).toContain("Successfully ran target");
    });

    it("runs a script only in scoped packages", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("my-script", "--scope", "package-1");
      expect(collectedOutput).toContain("package-1");
      expect(collectedOutput).not.toContain("package-3");
    });

    it("does not run a script in ignored packages", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("my-script", "--ignore", "package-@(2|3|4)");
      expect(collectedOutput).toContain("package-1");
      expect(collectedOutput).not.toContain("package-3");
    });

    it("runs a script in packages with --stream", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("my-script", "--stream");
      expect(collectedOutput).toContain("[package-1      ] package-1");
      expect(collectedOutput).toContain("[package-3      ] package-3");
    });

    it("runs a cacheable script", async () => {
      collectedOutput = "";
      await lernaRun(testDir)("my-cacheable-script");
      expect(collectedOutput).not.toContain("Nx read the output from the cache");

      collectedOutput = "";
      await lernaRun(testDir)("my-cacheable-script");
      expect(collectedOutput).toContain("Nx read the output from the cache");

      collectedOutput = "";
      await lernaRun(testDir)("my-cacheable-script", "--skip-nx-cache");
      expect(collectedOutput).not.toContain("Nx read the output from the cache");
    });
  });
});
