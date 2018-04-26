/* eslint-disable class-methods-use-this */

"use strict";

const fs = require("fs-extra");
const execa = require("execa");
const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");
const touch = require("touch");

// partially mocked
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");
const gitAdd = require("@lerna-test/git-add");
const gitCommit = require("@lerna-test/git-commit");
const gitTag = require("@lerna-test/git-tag");
const updateLernaConfig = require("@lerna-test/update-lerna-config");

// file under test
const Command = require("..");

describe("core-command", () => {
  let testDir;

  beforeAll(async () => {
    testDir = await initFixture("basic");
  });

  afterEach(() => {
    // ensure common CWD is restored when individual tests
    // initialize their own fixture (which changes CWD)
    if (process.cwd() !== testDir) {
      process.chdir(testDir);
    }
  });

  ChildProcessUtilities.getChildProcessCount = jest.fn(() => 0);

  // swallow errors when passed in argv
  const onRejected = () => {};

  class OkCommand extends Command {
    initialize() {
      return true;
    }
    execute() {}
  }

  // convenience to avoid silly "not implemented errors"
  const testFactory = (argv = {}) => new OkCommand(Object.assign({ cwd: testDir }, argv));

  describe(".lernaVersion", () => {
    it("should be added to the instance", async () => {
      expect(testFactory({ lernaVersion: "__TEST__" }).lernaVersion).toBe("__TEST__");
    });
  });

  describe(".logger", () => {
    it("should be added to the instance", async () => {
      const command = testFactory();
      await command;

      expect(command.logger).toBeDefined();
    });
  });

  describe(".concurrency", () => {
    it("should be added to the instance", async () => {
      const command = testFactory({ concurrency: 6 });
      await command;

      expect(command.concurrency).toBe(6);
    });

    it("should fall back to default if concurrency given is NaN", async () => {
      const command = testFactory({ concurrency: "bla" });
      await command;

      expect(command.concurrency).toBe(4);
    });

    it("should fall back to default if concurrency given is 0", async () => {
      const command = testFactory({ concurrency: 0 });
      await command;

      expect(command.concurrency).toBe(4);
    });

    it("should fall back to 1 if concurrency given is smaller than 1", async () => {
      const command = testFactory({ concurrency: -1 });
      await command;

      expect(command.concurrency).toBe(1);
    });
  });

  describe(".toposort", () => {
    it("is enabled by default", async () => {
      const command = testFactory();
      await command;

      expect(command.toposort).toBe(true);
    });

    it("is disabled when sort config is explicitly false (--no-sort)", async () => {
      const command = testFactory({ sort: false });
      await command;

      expect(command.toposort).toBe(false);
    });
  });

  describe(".execOpts", () => {
    const ONE_HUNDRED_MEGABYTES = 1000 * 1000 * 100;

    it("has maxBuffer", async () => {
      const command = testFactory({ maxBuffer: ONE_HUNDRED_MEGABYTES });
      await command;

      expect(command.execOpts.maxBuffer).toBe(ONE_HUNDRED_MEGABYTES);
    });

    it("has repo path", async () => {
      const command = testFactory();
      await command;

      expect(command.execOpts.cwd).toBe(testDir);
    });
  });

  it("returns a Promise", async () => {
    await testFactory();
  });

  describe("when finished", () => {
    it("resolves immediately when no child processes active", async () => {
      await testFactory();

      const logMessages = loggingOutput("warn");
      expect(logMessages).toHaveLength(0);
    });

    it("waits to resolve when 1 child process active", async () => {
      ChildProcessUtilities.getChildProcessCount.mockReturnValueOnce(1);

      await testFactory();

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Waiting for 1 child process to exit.");
    });

    it("waits to resolve when 2 child processes active", async () => {
      ChildProcessUtilities.getChildProcessCount.mockReturnValueOnce(2);

      await testFactory();

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Waiting for 2 child processes to exit.");
    });
  });

  describe("with package error", () => {
    const originalConsoleError = console.error;

    beforeEach(() => {
      console.error = jest.fn();
    });
    afterEach(() => {
      console.error = originalConsoleError;
    });

    it("logs stdout and stderr of error from package", async () => {
      class PkgErrorCommand extends Command {
        initialize() {
          return true;
        }
        execute() {
          const err = new Error("message");

          err.cmd = "test-pkg-err";
          err.stdout = "pkg-err-stdout";
          err.stderr = "pkg-err-stderr";
          err.pkg = {
            name: "pkg-err-name",
          };

          throw err;
        }
      }

      try {
        await new PkgErrorCommand({ cwd: testDir });
      } catch (err) {
        expect(console.error.mock.calls).toHaveLength(2);
        expect(console.error.mock.calls[0]).toEqual(["pkg-err-stdout"]);
        expect(console.error.mock.calls[1]).toEqual(["pkg-err-stderr"]);

        expect(err.cmd).toEqual("test-pkg-err");
        expect(err.stdout).toEqual("pkg-err-stdout");
        expect(err.stderr).toEqual("pkg-err-stderr");
        expect(err.pkg).toEqual({
          name: "pkg-err-name",
        });
      }
    });
  });

  describe("loglevel", () => {
    afterEach(() => {
      log.level = "silent";
    });

    it("is set from lerna.json config", async () => {
      const cwd = await initFixture("basic");

      await updateLernaConfig(cwd, { loglevel: "warn" });
      await testFactory({ cwd, onRejected });

      expect(log.level).toBe("warn");
    });
  });

  describe(".packages", () => {
    it("returns the list of packages", async () => {
      const command = testFactory();
      await command;

      expect(command.packages).toEqual([]);
    });
  });

  describe(".packageGraph", () => {
    it("returns the graph of packages", async () => {
      const command = testFactory();
      await command;

      expect(command.packageGraph).toBeInstanceOf(Map);
    });
  });

  describe(".filteredPackages", () => {
    it("--scope should filter packages", async () => {
      const cwd = await initFixture("filtering");

      const command = testFactory({
        cwd,
        scope: ["package-2", "package-4"],
      });
      await command;

      expect(command.filteredPackages).toHaveLength(2);
      expect(command.filteredPackages[0].name).toEqual("package-2");
      expect(command.filteredPackages[1].name).toEqual("package-4");
    });

    it("--since should return all packages if no tag is found", async () => {
      const cwd = await initFixture("filtering");

      const command = testFactory({ cwd, since: "" });
      await command;

      expect(command.filteredPackages).toHaveLength(5);
    });

    it("--since should return packages updated since the last tag", async () => {
      const cwd = await initFixture("filtering");

      await gitTag(cwd, "v1.0.0");
      await touch(path.join(cwd, "packages/package-2/random-file"));
      await gitAdd(cwd, "-A");
      await gitCommit(cwd, "test");

      const command = testFactory({ cwd, since: "" });
      await command;

      expect(command.filteredPackages).toHaveLength(2);
      expect(command.filteredPackages[0].name).toEqual("package-2");
      expect(command.filteredPackages[1].name).toEqual("package-3");
    });

    it('--since "ref" should return packages updated since the specified ref', async () => {
      const cwd = await initFixture("filtering");

      // We first tag, then modify master to ensure that specifying --since will override checking against
      // the latest tag.
      await gitTag(cwd, "v1.0.0");

      await touch(path.join(cwd, "packages/package-1/random-file"));
      await gitAdd(cwd, "-A");
      await gitCommit(cwd, "test");

      // Then we can checkout a new branch, update and commit.
      await execa("git", ["checkout", "-b", "test"], { cwd });

      await touch(path.join(cwd, "packages/package-2/random-file"));
      await gitAdd(cwd, "-A");
      await gitCommit(cwd, "test");

      const command = testFactory({ cwd, since: "master" });
      await command;

      expect(command.filteredPackages).toHaveLength(2);
      expect(command.filteredPackages[0].name).toEqual("package-2");
      expect(command.filteredPackages[1].name).toEqual("package-3");
    });

    it("should respect --scope and --since when used together", async () => {
      const cwd = await initFixture("filtering");

      await execa("git", ["checkout", "-b", "test"], { cwd });
      await touch(path.join(cwd, "packages/package-4/random-file"));
      await gitAdd(cwd, "-A");
      await gitCommit(cwd, "test");

      const command = testFactory({
        cwd,
        scope: ["package-2", "package-3", "package-4"],
        since: "master",
      });
      await command;

      expect(command.filteredPackages).toHaveLength(1);
      expect(command.filteredPackages[0].name).toEqual("package-4");
    });
  });

  describe(".options", () => {
    class TestACommand extends Command {}
    class TestBCommand extends Command {}
    class TestCCommand extends Command {
      get defaultOptions() {
        return {
          testOption: "a",
          testOption2: "a",
          testOption3: "a",
        };
      }

      get otherCommandConfigs() {
        return ["testb"];
      }
    }

    it("should pick up global options", async () => {
      const instance = new TestACommand({ cwd: testDir, onRejected });
      await instance;

      expect(instance.options.testOption).toBe("default");
    });

    it("should override global options with command-level options", async () => {
      const instance = new TestBCommand({ cwd: testDir, onRejected });
      await instance;

      expect(instance.options.testOption).toBe("b");
    });

    it("should override global options with inherited command-level options", async () => {
      const instance = new TestCCommand({ cwd: testDir, onRejected });
      await instance;

      expect(instance.options.testOption).toBe("b");
    });

    it("should override inherited command-level options with local command-level options", async () => {
      const instance = new TestCCommand({ cwd: testDir, onRejected });
      await instance;

      expect(instance.options.testOption2).toBe("c");
    });

    it("should override everything with a CLI flag", async () => {
      const instance = new TestCCommand({
        cwd: testDir,
        onRejected,
        testOption2: "f",
      });
      await instance;

      expect(instance.options.testOption2).toBe("f");
    });

    it("should inherit durable options when a CLI flag is undefined", async () => {
      const instance = new TestCCommand({
        cwd: testDir,
        onRejected,
        testOption: undefined, // yargs does this when --test-option is not passed
      });
      await instance;

      expect(instance.options.testOption).toBe("b");
    });

    it("should merge flags with defaultOptions", async () => {
      const instance = new TestCCommand({
        cwd: testDir,
        onRejected,
        testOption: "b",
      });
      await instance;

      expect(instance.options.testOption).toBe("b");
      expect(instance.options.testOption2).toBe("c");
      expect(instance.options.testOption3).toBe("a");
    });
  });

  describe("subclass implementation", () => {
    ["initialize", "execute"].forEach(method => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command({ cwd: testDir, onRejected });
        expect(() => command[method]()).toThrow();
      });
    });
  });

  describe("validations", () => {
    it("throws ENOGIT when repository is not initialized", async () => {
      expect.assertions(1);

      const cwd = tempy.directory();

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.prefix).toBe("ENOGIT");
      }
    });

    it("throws ENOPKG when root package.json is not found", async () => {
      expect.assertions(1);

      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "package.json"));

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.prefix).toBe("ENOPKG");
      }
    });

    it("throws ENOLERNA when lerna.json is not found", async () => {
      expect.assertions(1);

      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "lerna.json"));

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.prefix).toBe("ENOLERNA");
      }
    });
  });
});
