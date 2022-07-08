/* eslint-disable class-methods-use-this */

"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");

// partially mocked
const childProcess = require("@lerna/child-process");
const os = require("os");

// normalize concurrency across different environments (localhost, CI, etc)
jest.spyOn(os, "cpus").mockImplementation(() => new Array(42));

// helpers
const initFixture = require("@lerna-test/helpers").initFixtureFactory(__dirname);
const { loggingOutput } = require("@lerna-test/helpers/logging-output");
const { updateLernaConfig } = require("@lerna-test/helpers");

// file under test
const { Command } = require("..");

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

  childProcess.getChildProcessCount = jest.fn(() => 0);

  // swallow errors when passed in argv
  const onRejected = () => {};

  class OkCommand extends Command {
    initialize() {
      return true;
    }

    execute() {
      return "ok";
    }
  }

  // convenience to avoid silly "not implemented errors"
  const testFactory = (argv = {}) => new OkCommand(Object.assign({ cwd: testDir }, argv));

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

      expect(command.concurrency).toBe(42);
    });

    it("should fall back to default if concurrency given is 0", async () => {
      const command = testFactory({ concurrency: 0 });
      await command;

      expect(command.concurrency).toBe(42);
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
    const result = await testFactory();

    expect(result).toBe("ok");
  });

  describe("when finished", () => {
    it("resolves immediately when no child processes active", async () => {
      await testFactory();

      const logMessages = loggingOutput("warn");
      expect(logMessages).toHaveLength(0);
    });

    it("waits to resolve when 1 child process active", async () => {
      childProcess.getChildProcessCount.mockReturnValueOnce(1);

      await testFactory();

      const [logMessage] = loggingOutput("warn");
      expect(logMessage).toMatch("Waiting for 1 child process to exit.");
    });

    it("waits to resolve when 2 child processes active", async () => {
      childProcess.getChildProcessCount.mockReturnValueOnce(2);

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

          err.command = "test-pkg-err";
          err.stdout = "pkg-err-stdout";
          err.stderr = "pkg-err-stderr";
          err.pkg = {
            name: "pkg-err-name",
          };

          throw err;
        }
      }

      const command = new PkgErrorCommand({ cwd: testDir });

      await expect(command).rejects.toThrow(
        expect.objectContaining({
          command: "test-pkg-err",
          stdout: "pkg-err-stdout",
          stderr: "pkg-err-stderr",
          pkg: expect.objectContaining({
            name: "pkg-err-name",
          }),
        })
      );

      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenNthCalledWith(1, "pkg-err-stdout");
      expect(console.error).toHaveBeenNthCalledWith(2, "pkg-err-stderr");
    });

    it("does not log stdout/stderr after streaming ends", async () => {
      class PkgErrorCommand extends Command {
        initialize() {
          return true;
        }

        execute() {
          const err = new Error("message");

          err.command = "test-pkg-err";
          err.stdout = "pkg-err-stdout";
          err.stderr = "pkg-err-stderr";
          err.pkg = {
            name: "pkg-err-name",
          };

          throw err;
        }
      }

      const command = new PkgErrorCommand({ cwd: testDir, stream: true });

      await expect(command).rejects.toThrow("message");
      expect(console.error).not.toHaveBeenCalled();
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

  describe(".packageGraph", () => {
    it("returns the graph of packages", async () => {
      const command = testFactory();
      await command;

      expect(command.packageGraph).toBeInstanceOf(Map);
    });
  });

  describe(".options", () => {
    class TestACommand extends Command {}
    class TestBCommand extends Command {}
    class TestCCommand extends Command {
      get otherCommandConfigs() {
        return ["testb"];
      }
    }

    it("does not mutate argv parameter", async () => {
      const argv = { cwd: testDir, onRejected };
      const instance = new TestACommand(argv);
      await instance;

      expect(argv).toEqual({ cwd: testDir, onRejected });
      expect(instance.argv).not.toEqual(argv);
    });

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
  });

  describe("subclass implementation", () => {
    ["initialize", "execute"].forEach((method) => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command({ cwd: testDir, onRejected });
        expect(() => command[method]()).toThrow();
      });
    });
  });

  describe("validations", () => {
    it("throws ENOGIT when repository is not initialized", async () => {
      const cwd = tempy.directory();

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: "ENOGIT",
        })
      );
    });

    it("throws ENOPKG when root package.json is not found", async () => {
      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "package.json"));

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: "ENOPKG",
        })
      );
    });

    it("throws JSONError when root package.json has syntax error", async () => {
      const cwd = await initFixture("basic");

      await fs.writeFile(
        path.join(cwd, "package.json"), // trailing comma ...v
        '{ "name": "invalid", "lerna": { "version": "1.0.0" }, }'
      );

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: "JSONError",
        })
      );
    });

    it("throws ENOLERNA when lerna.json is not found", async () => {
      const cwd = await initFixture("basic");

      await fs.remove(path.join(cwd, "lerna.json"));

      await expect(testFactory({ cwd })).rejects.toThrow(
        expect.objectContaining({
          prefix: "ENOLERNA",
        })
      );
    });
  });
});
