"use strict";

const fs = require("fs-extra");
const execa = require("execa");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const path = require("path");
const tempy = require("tempy");
const touch = require("touch");
const writeJsonFile = require("write-json-file");

const ChildProcessUtilities = require("../src/ChildProcessUtilities");

// helpers
const callsBack = require("./helpers/callsBack");
const initFixture = require("./helpers/initFixture");

// file under test
const Command = require("../src/Command");
const LERNA_VERSION = require("../package.json").version;

// silence logs
log.level = "silent";

const onAllExitedOriginal = ChildProcessUtilities.onAllExited;
const getChildProcessCountOriginal = ChildProcessUtilities.getChildProcessCount;

describe("Command", () => {
  const originalCWD = process.cwd();

  afterEach(() => jest.resetAllMocks());

  beforeAll(async () => {
    ChildProcessUtilities.onAllExited = jest.fn(callsBack());
    ChildProcessUtilities.getChildProcessCount = jest.fn(() => 0);

    const testDir = await initFixture("Command/basic");
    process.chdir(testDir);
  });

  afterAll(() => {
    ChildProcessUtilities.onAllExited = onAllExitedOriginal;
    ChildProcessUtilities.getChildProcessCount = getChildProcessCountOriginal;

    process.chdir(originalCWD);
  });

  // swallow errors when passed in argv
  const onRejected = () => {};

  class OkCommand extends Command {
    initialize(callback) {
      callback(null, true);
    }
    execute(callback) {
      callback(null, true);
    }
  }

  // convenience to avoid silly "not implemented errors"
  const testFactory = (argv = {}) => new OkCommand(argv);

  describe(".lernaVersion", () => {
    it("should be added to the instance", async () => {
      expect(testFactory().lernaVersion).toEqual(LERNA_VERSION);
    });
  });

  describe(".logger", () => {
    it("should be added to the instance", () => {
      expect(testFactory().logger).toBeDefined();
    });
  });

  describe(".concurrency", () => {
    it("should be added to the instance", () => {
      expect(testFactory({ concurrency: 6 }).concurrency).toBe(6);
    });

    it("should fall back to default if concurrency given is NaN", () => {
      expect(testFactory({ concurrency: "bla" }).concurrency).toBe(4);
    });

    it("should fall back to default if concurrency given is 0", () => {
      expect(testFactory({ concurrency: 0 }).concurrency).toBe(4);
    });

    it("should fall back to 1 if concurrency given is smaller than 1", () => {
      expect(testFactory({ concurrency: -1 }).concurrency).toBe(1);
    });
  });

  describe(".toposort", () => {
    it("is enabled by default", () => {
      expect(testFactory().toposort).toBe(true);
    });

    it("is disabled when sort config is explicitly false (--no-sort)", () => {
      expect(testFactory({ sort: false }).toposort).toBe(false);
    });
  });

  describe(".execOpts", () => {
    const ONE_HUNDRED_MEGABYTES = 1000 * 1000 * 100;

    it("has maxBuffer", () => {
      const command = testFactory({ maxBuffer: ONE_HUNDRED_MEGABYTES });
      expect(command.execOpts.maxBuffer).toBe(ONE_HUNDRED_MEGABYTES);
    });

    it("has repo path", () => {
      const command = testFactory();
      expect(command.execOpts.cwd).toBe(process.cwd());
    });
  });

  it("returns a Promise", async () => {
    await testFactory();
  });

  describe("when finished", () => {
    beforeEach(() => {
      ChildProcessUtilities.onAllExited = jest.fn(callsBack());
      ChildProcessUtilities.getChildProcessCount = jest.fn(() => 0);
    });

    it("resolves immediately when no child processes active", async () => {
      const { exitCode } = await testFactory();
      expect(exitCode).toBe(0);
    });

    it("waits to resolve when 1 child process active", async () => {
      ChildProcessUtilities.getChildProcessCount.mockReturnValue(1);

      let warning;
      log.once("log.warn", m => {
        warning = m;
      });

      await testFactory();

      expect(warning.message).toMatch("Waiting for 1 child process to exit.");
    });

    it("waits to resolve when 2 child processes active", async () => {
      ChildProcessUtilities.getChildProcessCount.mockReturnValue(2);

      let warning;
      log.once("log.warn", m => {
        warning = m;
      });

      await testFactory();

      expect(warning.message).toMatch("Waiting for 2 child processes to exit.");
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
        initialize(callback) {
          callback(null, true);
        }
        execute(callback) {
          // construct the error
          const err = new Error("message");
          err.cmd = "test-pkg-err";
          err.stdout = "pkg-err-stdout";
          err.stderr = "pkg-err-stderr";
          // add pkg property with stub info
          err.pkg = {
            name: "pkg-err-name",
          };
          // "throw" the error to reject command promise
          callback(err);
        }
      }

      try {
        await new PkgErrorCommand({});
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
      const cwd = await initFixture("Command/basic");

      const lernaJsonLocation = path.join(cwd, "lerna.json");
      const lernaConfig = await loadJsonFile(lernaJsonLocation);
      lernaConfig.loglevel = "warn";
      await writeJsonFile(lernaJsonLocation, lernaConfig, { indent: 2 });

      await testFactory({ cwd, onRejected });

      expect(log.level).toBe("warn");
    });
  });

  describe("get .packages", () => {
    it("returns the list of packages", () => {
      const { packages } = testFactory();
      expect(packages).toEqual([]);
    });
  });

  describe("get .packageGraph", () => {
    it("returns the graph of packages", () => {
      const { packageGraph } = testFactory();
      expect(packageGraph).toBeInstanceOf(Map);
    });
  });

  describe(".filteredPackages", () => {
    it("--scope should filter packages", async () => {
      const cwd = await initFixture("UpdatedCommand/basic");

      const { filteredPackages } = testFactory({
        cwd,
        scope: ["package-2", "package-4"],
      });
      expect(filteredPackages).toHaveLength(2);
      expect(filteredPackages[0].name).toEqual("package-2");
      expect(filteredPackages[1].name).toEqual("package-4");
    });

    it("--since should return all packages if no tag is found", async () => {
      const cwd = await initFixture("UpdatedCommand/basic");

      const { filteredPackages } = testFactory({ cwd, since: "" });
      expect(filteredPackages).toHaveLength(5);
    });

    it("--since should return packages updated since the last tag", async () => {
      const cwd = await initFixture("UpdatedCommand/basic");
      const git = (...args) => execa("git", args, { cwd });

      await git("tag", "1.0.0");
      await touch(path.join(cwd, "packages/package-2/random-file"));
      await git("add", ".");
      await git("commit", "-m", "test");

      const { filteredPackages } = testFactory({ cwd, since: "" });
      expect(filteredPackages).toHaveLength(2);
      expect(filteredPackages[0].name).toEqual("package-2");
      expect(filteredPackages[1].name).toEqual("package-3");
    });

    it('--since "ref" should return packages updated since the specified ref', async () => {
      const cwd = await initFixture("UpdatedCommand/basic");
      const git = (...args) => execa("git", args, { cwd });

      // We first tag, then modify master to ensure that specifying --since will override checking against
      // the latest tag.
      await git("tag", "1.0.0");
      await touch(path.join(cwd, "packages/package-1/random-file"));
      await git("add", ".");
      await git("commit", "-m", "test");

      // Then we can checkout a new branch, update and commit.
      await git("checkout", "-b", "test");
      await touch(path.join(cwd, "packages/package-2/random-file"));
      await git("add", ".");
      await git("commit", "-m", "test");

      const { filteredPackages } = testFactory({ cwd, since: "master" });
      expect(filteredPackages).toHaveLength(2);
      expect(filteredPackages[0].name).toEqual("package-2");
      expect(filteredPackages[1].name).toEqual("package-3");
    });

    it("should respect --scope and --since when used together", async () => {
      const cwd = await initFixture("UpdatedCommand/basic");
      const git = (...args) => execa("git", args, { cwd });

      await git("checkout", "-b", "test");
      await touch(path.join(cwd, "packages/package-4/random-file"));
      await git("add", ".");
      await git("commit", "-m", "test");

      const { filteredPackages } = testFactory({
        cwd,
        scope: ["package-2", "package-3", "package-4"],
        since: "master",
      });
      expect(filteredPackages).toHaveLength(1);
      expect(filteredPackages[0].name).toEqual("package-4");
    });
  });

  describe("get .options", () => {
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

    it("is a lazy getter", () => {
      const instance = new TestACommand({ onRejected });
      expect(instance.options).toBe(instance.options);
    });

    it("should pick up global options", () => {
      const instance = new TestACommand({ onRejected });
      expect(instance.options.testOption).toBe("default");
    });

    it("should override global options with command-level options", () => {
      const instance = new TestBCommand({ onRejected });
      expect(instance.options.testOption).toBe("b");
    });

    it("should override global options with inherited command-level options", () => {
      const instance = new TestCCommand({ onRejected });
      expect(instance.options.testOption).toBe("b");
    });

    it("should override inherited command-level options with local command-level options", () => {
      const instance = new TestCCommand({ onRejected });
      expect(instance.options.testOption2).toBe("c");
    });

    it("should override everything with a CLI flag", () => {
      const instance = new TestCCommand({
        onRejected,
        testOption2: "f",
      });
      expect(instance.options.testOption2).toBe("f");
    });

    it("should inherit durable options when a CLI flag is undefined", () => {
      const instance = new TestCCommand({
        onRejected,
        testOption: undefined, // yargs does this when --test-option is not passed
      });
      expect(instance.options.testOption).toBe("b");
    });

    it("should merge flags with defaultOptions", () => {
      const instance = new TestCCommand({
        onRejected,
        testOption: "b",
      });
      expect(instance.options.testOption).toBe("b");
      expect(instance.options.testOption2).toBe("c");
      expect(instance.options.testOption3).toBe("a");
    });
  });

  describe("legacy options", () => {
    let cwd;

    beforeAll(async () => {
      cwd = await initFixture("Command/legacy");
    });

    class TestCommand extends Command {}

    describe("bootstrapConfig", () => {
      afterEach(() => {
        log.removeAllListeners("log.warn");
      });

      class BootstrapCommand extends Command {}

      it("should warn when used", () => {
        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        const instance = new BootstrapCommand({ onRejected, cwd });

        instance.options; // eslint-disable-line no-unused-expressions

        expect(warning).toHaveProperty(
          "message",
          "`bootstrapConfig.ignore` has been replaced by `command.bootstrap.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new BootstrapCommand({ onRejected, cwd });
        expect(instance.options.ignore).toBe("package-a");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand({ onRejected, cwd });

        log.once("log.warn", () => {
          throw new Error("should not warn bootstrapConfig");
        });

        instance.options; // eslint-disable-line no-unused-expressions
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand({ onRejected, cwd });
        expect(instance.options.ignore).toBe(undefined);
      });
    });

    describe("publishConfig", () => {
      afterEach(() => {
        log.removeAllListeners("log.warn");
      });

      class PublishCommand extends Command {}

      it("should warn when used", () => {
        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        const instance = new PublishCommand({ onRejected, cwd });

        instance.options; // eslint-disable-line no-unused-expressions

        expect(warning).toHaveProperty(
          "message",
          "`publishConfig.ignore` has been replaced by `command.publish.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new PublishCommand({ onRejected, cwd });
        expect(instance.options.ignore).toBe("package-b");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand({ onRejected, cwd });

        log.once("log.warn", () => {
          throw new Error("should not warn publishConfig");
        });

        instance.options; // eslint-disable-line no-unused-expressions
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand({ onRejected, cwd });
        expect(instance.options.ignore).toBe(undefined);
      });
    });
  });

  describe("subclass implementation", () => {
    ["initialize", "execute"].forEach(method => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command({ onRejected });
        expect(() => command[method]()).toThrow();
      });
    });
  });

  describe("validations", () => {
    it("throws ENOGIT when repository is not initialized", async () => {
      const cwd = tempy.directory();

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.prefix).toBe("ENOGIT");
      }

      expect.assertions(2);
    });

    it("throws ENOPKG when root package.json is not found", async () => {
      const cwd = await initFixture("Command/basic");
      await fs.remove(path.join(cwd, "package.json"));

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.prefix).toBe("ENOPKG");
      }

      expect.assertions(2);
    });

    it("throws ENOLERNA when lerna.json is not found", async () => {
      const cwd = await initFixture("Command/basic");
      await fs.remove(path.join(cwd, "lerna.json"));

      try {
        await testFactory({ cwd });
      } catch (err) {
        expect(err.exitCode).toBe(1);
        expect(err.prefix).toBe("ENOLERNA");
      }

      expect.assertions(2);
    });
  });
});
