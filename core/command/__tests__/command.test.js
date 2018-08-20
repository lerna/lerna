/* eslint-disable class-methods-use-this */

"use strict";

const fs = require("fs-extra");
const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");

// partially mocked
const ChildProcessUtilities = require("@lerna/child-process");

// helpers
const initFixture = require("@lerna-test/init-fixture")(__dirname);
const loggingOutput = require("@lerna-test/logging-output");
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

    it("throws JSONError when root package.json has syntax error", async () => {
      expect.assertions(1);

      const cwd = await initFixture("basic");

      await fs.writeFile(
        path.join(cwd, "package.json"), // trailing comma ...v
        '{ "name": "invalid", "lerna": { "version": "1.0.0" }, }'
      );

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.prefix).toBe("JSONError");
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
