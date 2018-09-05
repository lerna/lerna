"use strict";

// we're actually testing integration with git
jest.unmock("@lerna/collect-updates");

const fs = require("fs-extra");
const path = require("path");

// mocked modules
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const loggingOutput = require("@lerna-test/logging-output");
const normalizeRelativeDir = require("@lerna-test/normalize-relative-dir");

// file under test
const lernaExec = require("@lerna-test/command-runner")(require("../command"));

// assertion helpers
const calledInPackages = () =>
  ChildProcessUtilities.spawn.mock.calls.map(([, , opts]) => path.basename(opts.cwd));

const execInPackagesStreaming = testDir =>
  ChildProcessUtilities.spawnStreaming.mock.calls.reduce((arr, [command, params, opts, prefix]) => {
    const dir = normalizeRelativeDir(testDir, opts.cwd);
    arr.push([dir, command, `(prefix: ${prefix})`].concat(params).join(" "));
    return arr;
  }, []);

describe("ExecCommand", () => {
  // TODO: it's very suspicious that mockResolvedValue() doesn't work here
  ChildProcessUtilities.spawn = jest.fn(() => Promise.resolve({ code: 0 }));
  ChildProcessUtilities.spawnStreaming = jest.fn(() => Promise.resolve({ code: 0 }));

  afterEach(() => {
    process.exitCode = undefined;
  });

  describe("in a basic repo", () => {
    it("should complain if invoked without command", async () => {
      expect.assertions(1);

      const testDir = await initFixture("basic");

      try {
        await lernaExec(testDir)("--parallel");
      } catch (err) {
        expect(err.message).toBe("A command to execute is required");
      }
    });

    it("rejects with execution error", async () => {
      const testDir = await initFixture("basic");

      ChildProcessUtilities.spawn.mockImplementationOnce((cmd, args) => {
        const boom = new Error("execution error");

        boom.failed = true;
        boom.code = 123;
        boom.cmd = [cmd].concat(args).join(" ");

        throw boom;
      });

      try {
        await lernaExec(testDir)("boom");
      } catch (err) {
        expect(err.message).toBe("execution error");
        expect(err.cmd).toBe("boom");
        expect(process.exitCode).toBe(123);
      }
    });

    it("should ignore execution errors with --no-bail", async () => {
      const testDir = await initFixture("basic");

      ChildProcessUtilities.spawn.mockImplementationOnce((cmd, args, { pkg }) => {
        const boom = new Error(pkg.name);

        boom.failed = true;
        boom.code = 456;
        boom.cmd = [cmd].concat(args).join(" ");

        // --no-bail passes { reject: false } to execa, so throwing is inappropriate
        return Promise.resolve(boom);
      });

      try {
        await lernaExec(testDir)("boom", "--no-bail", "--", "--shaka", "--lakka");
      } catch (err) {
        expect(err.message).toBe("package-1");
        expect(err.cmd).toBe("boom --shaka --lakka");
        expect(process.exitCode).toBe(456);
      }

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(ChildProcessUtilities.spawn).lastCalledWith(
        "boom",
        ["--shaka", "--lakka"],
        expect.objectContaining({
          reject: false,
        })
      );
    });

    it("should filter packages with `ignore`", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("ls", "--ignore", "package-1");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
      expect(ChildProcessUtilities.spawn).lastCalledWith("ls", [], {
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

    it("should filter packages that are not updated with --since", async () => {
      const testDir = await initFixture("basic");
      const file1 = path.join(testDir, "packages/package-1", "file-1.js");
      const file2 = path.join(testDir, "packages/package-2", "file-2.js");

      // make change
      await fs.appendFile(file2, "// package-2");
      await gitAdd(testDir, file2);
      await gitCommit(testDir, "skip change");

      // tag a release
      await gitTag(testDir, "v1.0.1");

      // make another change
      await fs.appendFile(file1, "// package-1");
      await gitAdd(testDir, file1);
      await gitCommit(testDir, "show change");

      await lernaExec(testDir)("ls", "--since");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(1);
      expect(ChildProcessUtilities.spawn).lastCalledWith("ls", [], {
        cwd: path.join(testDir, "packages/package-1"),
        pkg: expect.objectContaining({
          name: "package-1",
        }),
        env: expect.objectContaining({
          LERNA_PACKAGE_NAME: "package-1",
        }),
        extendEnv: false,
        reject: true,
        shell: true,
      });
    });

    it("requires a git repo when using --since", async () => {
      expect.assertions(1);

      const testDir = await initFixture("basic");

      await fs.remove(path.join(testDir, ".git"));

      try {
        await lernaExec(testDir)("ls", "--since", "some-branch");
      } catch (err) {
        expect(err.message).toMatch("this is not a git repository");
      }
    });

    it("should run a command", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("ls");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(calledInPackages()).toEqual(["package-1", "package-2"]);
    });

    it("should run a command with parameters", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("ls", "--", "-la");

      expect(ChildProcessUtilities.spawn).toHaveBeenCalledTimes(2);
      expect(ChildProcessUtilities.spawn).lastCalledWith("ls", ["-la"], expect.any(Object));
    });

    it("runs a command for a given scope", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("ls", "--scope", "package-1");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("does not run a command for ignored packages", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("ls", "--ignore", "package-@(2|3|4)");

      expect(calledInPackages()).toEqual(["package-1"]);
    });

    it("executes a command in all packages with --parallel", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("--parallel", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: package-1)",
        "packages/package-2 ls (prefix: package-2)",
      ]);
    });

    it("omits package prefix with --parallel --no-prefix", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("--parallel", "--no-prefix", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: false)",
        "packages/package-2 ls (prefix: false)",
      ]);
    });

    it("executes a command in all packages with --stream", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("--stream", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: package-1)",
        "packages/package-2 ls (prefix: package-2)",
      ]);
    });

    it("omits package prefix with --stream --no-prefix", async () => {
      const testDir = await initFixture("basic");

      await lernaExec(testDir)("--stream", "--no-prefix", "ls");

      expect(execInPackagesStreaming(testDir)).toEqual([
        "packages/package-1 ls (prefix: false)",
        "packages/package-2 ls (prefix: false)",
      ]);
    });
  });

  describe("in a cyclical repo", () => {
    it("warns when cycles are encountered", async () => {
      const testDir = await initFixture("toposort");

      await lernaExec(testDir)("ls");

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Dependency cycles detected, you should fix these!");
      expect(logMessage).toMatch("package-cycle-1 -> package-cycle-2 -> package-cycle-1");
      expect(logMessage).toMatch("package-cycle-2 -> package-cycle-1 -> package-cycle-2");
      expect(logMessage).toMatch(
        "package-cycle-extraneous -> package-cycle-1 -> package-cycle-2 -> package-cycle-1"
      );

      expect(calledInPackages()).toEqual([
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
      expect.assertions(1);

      const testDir = await initFixture("toposort");

      try {
        await lernaExec(testDir)("ls", "--reject-cycles");
      } catch (err) {
        expect(err.message).toMatch("Dependency cycles detected, you should fix these!");
      }
    });
  });
});
