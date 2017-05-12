import log from "npmlog";

import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import GitUtilities from "../src/GitUtilities";

// helpers
import execa from "execa";

import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";

// file under test
import Command from "../src/Command";

// silence logs
log.level = "silent";

describe("Command", () => {
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

  describe(".flags", () => {
    it("should be added to the instance", () => {
      const command = new Command(null, { foo: "bar" });
      expect(command.flags).toEqual({ foo: "bar" });
    });
  });

  describe(".lernaVersion", () => {
    it("should be added to the instance", () => {
      const command = new Command([], {});
      expect(command.lernaVersion).toEqual(require("../package.json").version);
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

    beforeAll(() => initFixture("Command/basic").then((dir) => {
      testDir = dir;
    }));

    it("should exist", (done) => {
      class TestCommand extends Command {
        initialize(callback) {
          callback(null, true);
        }
        execute() {
          done();
        }
      }

      const testCommand = new TestCommand([], {}, testDir);
      testCommand.run();
    });

    describe("when complete", () => {
      class ExitCommand extends Command {
        initialize(callback) {
          callback(null, true);
        }
        execute(callback) {
          callback(null, true);
        }
      }

      beforeEach(() => {
        ChildProcessUtilities.onAllExited = jest.fn(callsBack());
      });

      [null, "process", "processes"].forEach((msg, idx) => {
        const title = (msg === null)
          ? "calls finish"
          : `waits for ${idx} child ${msg}`;

        it(title, (done) => {
          ChildProcessUtilities.getChildProcessCount = jest.fn(() => idx);

          const exitCommand = new ExitCommand([], {}, testDir);

          let warning;
          log.once("log.warn", (m) => {
            warning = m;
          });

          exitCommand.runValidations();
          exitCommand.runPreparations();

          exitCommand.runCommand((err, code) => {
            if (err) return done.fail(err);
            try {
              expect(code).toBe(0);

              if (msg) {
                expect(warning.message).toMatch(`Waiting for ${idx} child ${msg} to exit.`);
              }

              done();
            } catch (ex) {
              done.fail(ex);
            }
          });
        });
      });
    });
  });

  describe(".runValidations()", () => {
    it("needs tests");
  });

  describe(".runPreparations()", () => {
    describe(".filteredPackages", () => {
      let testDir;

      beforeEach(() => initFixture("UpdatedCommand/basic").then((dir) => {
        testDir = dir;
      }));

      class TestCommand extends Command {}

      function cli(cmd, ...args) {
        return execa.sync(cmd, args, { cwd: testDir }).stdout.toString("utf-8");
      }

      function run(opts) {
        const cmd = new TestCommand([], opts, testDir);
        cmd.run();
        return cmd;
      }

      it("--scope should filter packages", () => {
        const { filteredPackages } = run({ scope: ["package-2", "package-4"] });
        expect(filteredPackages.length).toEqual(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-4");
      });

      it("--since should return all packages if no tag is found", () => {
        const { filteredPackages } = run({ since: "" });
        expect(filteredPackages.length).toEqual(5);
      });

      it("--since should return packages updated since the last tag", () => {
        cli("git", "tag", "1.0.0");
        cli("touch", "packages/package-2/random-file");
        cli("git", "add", ".");
        cli("git", "commit", "-m", "test");

        const { filteredPackages } = run({ since: "" });
        expect(filteredPackages.length).toEqual(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-3");
      });

      it("--since \"ref\" should return packages updated since the specified ref", () => {
        // We first tag, then modify master to ensure that specifying --since will override checking against
        // the latest tag.
        cli("git", "tag", "1.0.0");
        cli("touch", "packages/package-1/random-file");
        cli("git", "add", ".");
        cli("git", "commit", "-m", "test");

        // Then we can checkout a new branch, update and commit.
        cli("git", "checkout", "-b", "test");
        cli("touch", "packages/package-2/random-file");
        cli("git", "add", ".");
        cli("git", "commit", "-m", "test");

        const { filteredPackages } = run({ since: "master" });
        expect(filteredPackages.length).toEqual(2);
        expect(filteredPackages[0].name).toEqual("package-2");
        expect(filteredPackages[1].name).toEqual("package-3");
      });

      it("should respect --scope and --since when used together", () => {
        cli("git", "checkout", "-b", "test");
        cli("touch", "packages/package-4/random-file");
        cli("git", "add", ".");
        cli("git", "commit", "-m", "test");

        const { filteredPackages } = run({
          scope: ["package-2", "package-3", "package-4"],
          since: "master"
        });
        expect(filteredPackages.length).toEqual(1);
        expect(filteredPackages[0].name).toEqual("package-4");
      });
    });
  });

  describe("get .options", () => {
    let testDir;

    beforeAll(() => initFixture("Command/basic").then((dir) => {
      testDir = dir;
    }));

    class TestACommand extends Command {
    }
    class TestBCommand extends Command {
    }
    class TestCCommand extends Command {
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
      const instance = new TestCCommand([], {
        testOption2: "f",
      }, testDir);
      expect(instance.options.testOption2).toBe("f");
    });

    it("should inherit durable options when a CLI flag is undefined", () => {
      const instance = new TestCCommand([], {
        testOption: undefined, // yargs does this when --test-option is not passed
      }, testDir);
      expect(instance.options.testOption).toBe("b");
    });
  });

  describe("legacy options", () => {
    let testDir;

    beforeAll(() => initFixture("Command/legacy").then((dir) => {
      testDir = dir;
    }));

    class TestCommand extends Command {
    }

    describe("bootstrapConfig", () => {
      afterEach(() => {
        log.removeAllListeners("log.warn");
      });

      class BootstrapCommand extends Command {
      }

      it("should warn when used", () => {
        const instance = new BootstrapCommand([], {}, testDir);

        let warning;
        log.once("log.warn", (m) => {
          warning = m;
        });

        instance.options;

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

        instance.options;
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

      class PublishCommand extends Command {
      }

      it("should warn when used", () => {
        const instance = new PublishCommand([], {}, testDir);

        let warning;
        log.once("log.warn", (m) => {
          warning = m;
        });

        instance.options;

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

        instance.options;
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        expect(instance.options.ignore).toBe(undefined);
      });
    });
  });

  describe("subclass implementation", () => {
    ["initialize", "execute"].forEach((method) => {
      it(`throws if ${method}() is not overridden`, () => {
        const command = new Command([], {});
        expect(() => command[method]()).toThrow();
      });
    });
  });
});
