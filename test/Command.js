import execa from "execa";
import loadJsonFile from "load-json-file";
import log from "npmlog";
import path from "path";
import touch from "touch";
import writeJsonFile from "write-json-file";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import GitUtilities from "../src/GitUtilities";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";

// file under test
import Command from "../src/Command";

// silence logs
log.level = "silent";

describe("Command", () => {
  class OkCommand extends Command {
    initialize(callback) {
      callback(null, true);
    }
    execute(callback) {
      callback(null, true);
    }
  }

  beforeEach(() => {
    // only used to check for VERSION file
    FileSystemUtilities.existsSync = jest.fn(() => false);

    // only used in runValidations(), tested elsewhere
    GitUtilities.isInitialized = jest.fn(() => true);
  });

  afterEach(() => jest.resetAllMocks());

  describe(".input", () => {
    it("should be added to the instance", () => {
      const command = new Command(["a", "b", "c"], {});
      expect(command.input).toEqual(["a", "b", "c"]);
    });
  });

  describe(".lernaVersion", () => {
    it("should be added to the instance", async () => {
      const command = new Command([], {});
      const { version } = await loadJsonFile(path.resolve(__dirname, "../package.json"));
      expect(command.lernaVersion).toEqual(version);
    });
  });

  describe(".logger", () => {
    it("should be added to the instance", () => {
      const command = new Command([], {});
      expect(command.logger).toBeDefined();
    });
  });

  describe(".concurrency", () => {
    it("should be added to the instance", () => {
      const command = new Command(null, { concurrency: 6 });
      expect(command.concurrency).toBe(6);
    });

    it("should fall back to default if concurrency given is NaN", () => {
      const command = new Command(null, { concurrency: "bla" });
      expect(command.concurrency).toBe(4);
    });

    it("should fall back to default if concurrency given is 0", () => {
      expect(new Command(null, { concurrency: 0 }).concurrency).toBe(4);
    });

    it("should fall back to 1 if concurrency given is smaller than 1", () => {
      expect(new Command(null, { concurrency: -1 }).concurrency).toBe(1);
    });
  });

  describe(".toposort", () => {
    it("is enabled by default", () => {
      const command = new Command([], {});
      expect(command.toposort).toBe(true);
    });

    it("is enabled when sort config is null", () => {
      const command = new Command([], { sort: null });
      expect(command.toposort).toBe(true);
    });

    it("is disabled when sort config is explicitly false (--no-sort)", () => {
      const command = new Command([], { sort: false });
      expect(command.toposort).toBe(false);
    });
  });

  describe(".execOpts", () => {
    const ONE_HUNDRED_MEGABYTES = 1000 * 1000 * 100;
    const REPO_PATH = process.cwd();

    it("has maxBuffer", () => {
      const command = new Command([], { maxBuffer: ONE_HUNDRED_MEGABYTES });
      expect(command.execOpts.maxBuffer).toBe(ONE_HUNDRED_MEGABYTES);
    });

    it("has repo path", () => {
      const command = new Command([], {}, REPO_PATH);
      expect(command.execOpts.cwd).toBe(REPO_PATH);
    });
  });

  describe(".run()", () => {
    let testDir;

    beforeAll(() =>
      initFixture("Command/basic").then(dir => {
        testDir = dir;
      })
    );

    it("returns a Promise", async () => {
      await new OkCommand([], {}, testDir).run();
    });

    describe("when finished", () => {
      beforeEach(() => {
        ChildProcessUtilities.onAllExited = jest.fn(callsBack());
        ChildProcessUtilities.getChildProcessCount = jest.fn(() => 0);
      });

      it("resolves immediately when no child processes active", async () => {
        const ok = new OkCommand([], {}, testDir);
        const { exitCode } = await ok.run();
        expect(exitCode).toBe(0);
      });

      it("waits to resolve when 1 child process active", async () => {
        ChildProcessUtilities.getChildProcessCount.mockReturnValue(1);

        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        const ok = new OkCommand([], {}, testDir);
        await ok.run();

        expect(warning.message).toMatch("Waiting for 1 child process to exit.");
      });

      it("waits to resolve when 2 child processes active", async () => {
        ChildProcessUtilities.getChildProcessCount.mockReturnValue(2);

        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        const ok = new OkCommand([], {}, testDir);
        await ok.run();

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
            // "throw" the error to reject .run() promise
            callback(err);
          }
        }

        try {
          await new PkgErrorCommand([], {}, testDir).run();
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
        const lernaJsonLocation = path.join(testDir, "lerna.json");
        const lernaConfig = await loadJsonFile(lernaJsonLocation);
        lernaConfig.loglevel = "warn";
        await writeJsonFile(lernaJsonLocation, lernaConfig, { indent: 2 });

        const ok = new OkCommand([], {}, testDir);
        await ok.run();

        expect(log.level).toBe("warn");
      });
    });
  });

  // describe(".runValidations()", () => {
  //   it("needs tests");
  // });

  describe(".runPreparations()", () => {
    let testDir;

    function cli(cmd, ...args) {
      return execa(cmd, args, { cwd: testDir });
    }

    function run(opts) {
      const cmd = new OkCommand([], opts, testDir);
      return cmd.run().then(() => cmd);
    }

    describe("get .packages", () => {
      it("returns the list of packages", async () => {
        testDir = await initFixture("Command/basic");
        const { packages } = await run();
        expect(packages).toEqual([]);
      });
    });

    describe("get .packageGraph", () => {
      it("returns the graph of packages", async () => {
        testDir = await initFixture("Command/basic");
        const { packageGraph } = await run();
        expect(packageGraph).toBeDefined();
        expect(packageGraph).toHaveProperty("nodes", []);
        expect(packageGraph).toHaveProperty("nodesByName", {});
      });
    });

    describe(".filteredPackages", () => {
      beforeEach(() =>
        initFixture("UpdatedCommand/basic").then(dir => {
          testDir = dir;
        })
      );

      it("--scope should filter packages", async () => {
        const { filteredPackages } = await run({ scope: ["package-2", "package-4"] });
        expect(filteredPackages).toHaveLength(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-4");
      });

      it("--since should return all packages if no tag is found", async () => {
        const { filteredPackages } = await run({ since: "" });
        expect(filteredPackages).toHaveLength(5);
      });

      it("--since should return packages updated since the last tag", async () => {
        await cli("git", "tag", "1.0.0");
        await touch(path.join(testDir, "packages/package-2/random-file"));
        await cli("git", "add", ".");
        await cli("git", "commit", "-m", "test");

        const { filteredPackages } = await run({ since: "" });
        expect(filteredPackages).toHaveLength(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-3");
      });

      it('--since "ref" should return packages updated since the specified ref', async () => {
        // We first tag, then modify master to ensure that specifying --since will override checking against
        // the latest tag.
        await cli("git", "tag", "1.0.0");
        await touch(path.join(testDir, "packages/package-1/random-file"));
        await cli("git", "add", ".");
        await cli("git", "commit", "-m", "test");

        // Then we can checkout a new branch, update and commit.
        await cli("git", "checkout", "-b", "test");
        await touch(path.join(testDir, "packages/package-2/random-file"));
        await cli("git", "add", ".");
        await cli("git", "commit", "-m", "test");

        const { filteredPackages } = await run({ since: "master" });
        expect(filteredPackages).toHaveLength(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-3");
      });

      it("should respect --scope and --since when used together", async () => {
        await cli("git", "checkout", "-b", "test");
        await touch(path.join(testDir, "packages/package-4/random-file"));
        await cli("git", "add", ".");
        await cli("git", "commit", "-m", "test");

        const { filteredPackages } = await run({
          scope: ["package-2", "package-3", "package-4"],
          since: "master",
        });
        expect(filteredPackages).toHaveLength(1);
        expect(filteredPackages[0].name).toEqual("package-4");
      });
    });
  });

  describe("get .options", () => {
    let testDir;

    beforeAll(() =>
      initFixture("Command/basic").then(dir => {
        testDir = dir;
      })
    );

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
      const instance = new TestACommand([], {}, testDir);
      expect(instance.options).toBe(instance.options);
    });

    it("should pick up global options", () => {
      const instance = new TestACommand([], {}, testDir);
      expect(instance.options.testOption).toBe("default");
    });

    it("should override global options with command-level options", () => {
      const instance = new TestBCommand([], {}, testDir);
      expect(instance.options.testOption).toBe("b");
    });

    it("should override global options with inherited command-level options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.options.testOption).toBe("b");
    });

    it("should override inherited command-level options with local command-level options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.options.testOption2).toBe("c");
    });

    it("should override everything with a CLI flag", () => {
      const instance = new TestCCommand(
        [],
        {
          testOption2: "f",
        },
        testDir
      );
      expect(instance.options.testOption2).toBe("f");
    });

    it("should inherit durable options when a CLI flag is undefined", () => {
      const instance = new TestCCommand(
        [],
        {
          testOption: undefined, // yargs does this when --test-option is not passed
        },
        testDir
      );
      expect(instance.options.testOption).toBe("b");
    });

    it("should merge flags with defaultOptions", () => {
      const instance = new TestCCommand(
        [],
        {
          testOption: "b",
        },
        testDir
      );
      expect(instance.options.testOption).toBe("b");
      expect(instance.options.testOption2).toBe("c");
      expect(instance.options.testOption3).toBe("a");
    });
  });

  describe("legacy options", () => {
    let testDir;

    beforeAll(() =>
      initFixture("Command/legacy").then(dir => {
        testDir = dir;
      })
    );

    class TestCommand extends Command {}

    describe("bootstrapConfig", () => {
      afterEach(() => {
        log.removeAllListeners("log.warn");
      });

      class BootstrapCommand extends Command {}

      it("should warn when used", () => {
        const instance = new BootstrapCommand([], {}, testDir);

        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        instance.options; // eslint-disable-line no-unused-expressions

        expect(warning).toHaveProperty(
          "message",
          "`bootstrapConfig.ignore` has been replaced by `command.bootstrap.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new BootstrapCommand([], {}, testDir);
        expect(instance.options.ignore).toBe("package-a");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand([], {}, testDir);

        log.once("log.warn", () => {
          throw new Error("should not warn bootstrapConfig");
        });

        instance.options; // eslint-disable-line no-unused-expressions
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        expect(instance.options.ignore).toBe(undefined);
      });
    });

    describe("publishConfig", () => {
      afterEach(() => {
        log.removeAllListeners("log.warn");
      });

      class PublishCommand extends Command {}

      it("should warn when used", () => {
        const instance = new PublishCommand([], {}, testDir);

        let warning;
        log.once("log.warn", m => {
          warning = m;
        });

        instance.options; // eslint-disable-line no-unused-expressions

        expect(warning).toHaveProperty(
          "message",
          "`publishConfig.ignore` has been replaced by `command.publish.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new PublishCommand([], {}, testDir);
        expect(instance.options.ignore).toBe("package-b");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand([], {}, testDir);

        log.once("log.warn", () => {
          throw new Error("should not warn publishConfig");
        });

        instance.options; // eslint-disable-line no-unused-expressions
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        expect(instance.options.ignore).toBe(undefined);
      });
    });
  });

  describe("subclass implementation", () => {
    ["initialize", "execute"].forEach(method => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command([], {});
        expect(() => command[method]()).toThrow();
      });
    });
  });
});
