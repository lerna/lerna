import { commandRunner, initFixtureFactory, loggingOutput, normalizeRelativeDir } from "@lerna/test-helpers";
import fs from "fs-extra";
import globby from "globby";
import path from "path";

const initFixture = initFixtureFactory(__dirname);

// mocked modules
// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

// file under test
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lernaExec = commandRunner(require("../command"));

// assertion helpers
const calledInPackages = () => childProcess.spawn.mock.calls.map(([, , opts]) => path.basename(opts.cwd));

const execInPackagesStreaming = (testDir) =>
  childProcess.spawnStreaming.mock.calls.reduce((arr, [command, params, opts, prefix]) => {
    const dir = normalizeRelativeDir(testDir, opts.cwd);
    arr.push([dir, command, `(prefix: ${prefix})`].concat(params).join(" "));
    return arr;
  }, []);

describe("ExecCommand", () => {
  // TODO: it's very suspicious that mockResolvedValue() doesn't work here
  childProcess.spawn = jest.fn(() => Promise.resolve({ exitCode: 0 }));
  childProcess.spawnStreaming = jest.fn(() => Promise.resolve({ exitCode: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe("in a basic repo", () => {
    // working dir is never mutated
    let testDir;

    beforeAll(async () => {
      testDir = await initFixture("basic");
    });

    it("should complain if invoked without command", async () => {
      const command = lernaExec(testDir)("--parallel");

      await expect(command).rejects.toThrow("A command to execute is required");
    });

    it("rejects with execution error", async () => {
      childProcess.spawn.mockImplementationOnce((cmd, args) => {
        const boom = new Error("execution error") as any;

        boom.failed = true;
        boom.exitCode = 123;
        boom.command = [cmd].concat(args).join(" ");

        throw boom;
      });

      const command = lernaExec(testDir)("boom");

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          message: "execution error",
          command: "boom",
        })
      );
      expect(process.exitCode).toBe(123);
    });

    it("should ignore execution errors with --no-bail", async () => {
      childProcess.spawn.mockImplementationOnce((cmd, args, { pkg }) => {
        const boom = new Error(pkg.name) as any;

        boom.failed = true;
        boom.exitCode = 456;
        boom.cmd = [cmd].concat(args).join(" ");

        // --no-bail passes { reject: false } to execa, so throwing is inappropriate
        return Promise.resolve(boom);
      });

      await lernaExec(testDir)("boom", "--no-bail", "--", "--shaka", "--lakka");

      // command doesn't throw, but it _does_ set exitCode
      expect(process.exitCode).toBe(456);

      expect(childProcess.spawn).toHaveBeenCalledTimes(2);
      expect(childProcess.spawn).toHaveBeenLastCalledWith(
        "boom",
        ["--shaka", "--lakka"],
        expect.objectContaining({
          reject: false,
        })
      );
    });

    it("should filter packages with `ignore`", async () => {
      await lernaExec(testDir)("ls", "--ignore", "package-1");

      expect(childProcess.spawn).toHaveBeenCalledTimes(1);
      expect(childProcess.spawn).toHaveBeenLastCalledWith("ls", [], {
        cwd: path.join(testDir, "packages/package-2"),
        pkg: expect.objectContaining({
          name: "package-2",
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: "package-2",
          LERNA_ROOT_PATH: testDir,
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it("should run a command", async () => {
      await lernaExec(testDir)("ls");

      expect(childProcess.spawn).toHaveBeenCalledTimes(2);
      expect(calledInPackages()).toEqual(["package-1", "package-2"]);
    });

    it("should run a command with parameters", async () => {
      await lernaExec(testDir)("ls", "--", "-la");

      expect(childProcess.spawn).toHaveBeenCalledTimes(2);
      expect(childProcess.spawn).toHaveBeenLastCalledWith("ls", ["-la"], expect.any(Object));
    });

    it("runs a command for a given scope", async () => {
      await lernaExec(testDir)("ls", "--scope", "package-1");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("does not run a command for ignored packages", async () => {
      await lernaExec(testDir)("ls", "--ignore", "package-@(2|3|4)");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("executes a command in all packages with --parallel", async () => {
      await lernaExec(testDir)("--parallel", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: package-1)",
        "packages/package-2 ls (prefix: package-2)",
      ]);
    });

    it("omits package prefix with --parallel --no-prefix", async () => {
      await lernaExec(testDir)("--parallel", "--no-prefix", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: false)",
        "packages/package-2 ls (prefix: false)",
      ]);
    });

    it("executes a command in all packages with --stream", async () => {
      await lernaExec(testDir)("--stream", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: package-1)",
        "packages/package-2 ls (prefix: package-2)",
      ]);
    });

    it("omits package prefix with --stream --no-prefix", async () => {
      await lernaExec(testDir)("--stream", "--no-prefix", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: false)",
        "packages/package-2 ls (prefix: false)",
      ]);
    });

    it("does not explode with filter flags", async () => {
      await lernaExec(testDir)(
        "ls",
        "--no-private",
        "--since",
        "--include-merged-tags",
        "--exclude-dependents",
        "--include-dependencies"
      );

      expect(calledInPackages()).toEqual(["package-1", "package-2"]);
    });
  });

  describe("with --profile", () => {
    it("executes a profiled command in all packages", async () => {
      const cwd = await initFixture("basic");

      await lernaExec(cwd)("--profile", "--", "ls");

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
          name: "package-2",
        },
      ]);
    });

    it("accepts --profile-location", async () => {
      const cwd = await initFixture("basic");

      await lernaExec(cwd)("--profile", "--profile-location", "foo/bar", "--", "ls");

      const [profileLocation] = await globby("foo/bar/Lerna-Profile-*.json", { cwd, absolute: true });
      // check if dependency is already installed
      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const exists = await fs.exists(profileLocation);

      expect(exists).toBe(true);
    });
  });

  describe("with --no-sort", () => {
    it("runs commands in lexical (not topological) order", async () => {
      const testDir = await initFixture("toposort");

      await lernaExec(testDir)("ls", "--no-sort");

      expect(calledInPackages()).toEqual([
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
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("toposort");

      await lernaExec(testDir)("ls", "--concurrency", "1");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");

      expect(calledInPackages()).toEqual([
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

    it("throws an error with --reject-cycles", async () => {
      const testDir = await initFixture("toposort");
      const command = lernaExec(testDir)("ls", "--reject-cycles");

      await expect(command).rejects.toThrow("Dependency cycles detected, you should fix these!");
    });
  });
});
