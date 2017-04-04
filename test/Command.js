// mocked or stubbed modules
import ChildProcessUtilities from "../src/ChildProcessUtilities";
import FileSystemUtilities from "../src/FileSystemUtilities";
import GitUtilities from "../src/GitUtilities";
import logger from "../src/logger";
import progressBar from "../src/progressBar";

// helpers
import callsBack from "./helpers/callsBack";
import initFixture from "./helpers/initFixture";

// file under test
import Command, { exposeCommands } from "../src/Command";

jest.mock("../src/ChildProcessUtilities");
jest.mock("../src/FileSystemUtilities");
jest.mock("../src/GitUtilities");

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
      const command = new Command(["a", "b", "c"]);
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
      const command = new Command();
      expect(command.lernaVersion).toEqual(require("../package.json").version);
    });
  });

  describe(".progressBar", () => {
    it("should be added to the instance", () => {
      const command = new Command();
      expect(command.progressBar).toBe(progressBar);
    });
  });

  describe(".logger", () => {
    it("should be added to the instance", () => {
      const command = new Command();
      expect(command.logger).toBe(logger);
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
          const logInfo = jest.spyOn(exitCommand.logger, "info");

          exitCommand.runValidations();
          exitCommand.runPreparations();

          exitCommand.runCommand((err, code) => {
            if (err) return done.fail(err);
            try {
              expect(code).toBe(0);

              if (msg) {
                expect(logInfo).lastCalledWith(
                  expect.stringContaining(`Waiting for ${idx} child ${msg} to exit.`)
                );
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
    it("needs tests");
  });

  describe(".getOptions()", () => {
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

    it("should pick up global options", () => {
      const instance = new TestACommand([], {}, testDir);
      expect(instance.getOptions().testOption).toBe("default");
    });

    it("should override global options with command-level options", () => {
      const instance = new TestBCommand([], {}, testDir);
      expect(instance.getOptions().testOption).toBe("b");
    });

    it("should override global options with inherited command-level options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.getOptions().testOption).toBe("b");
    });

    it("should override inherited command-level options with local command-level options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.getOptions().testOption2).toBe("c");
    });

    it("should override command-level options with passed-in options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.getOptions({ testOption2: "p" }).testOption2).toBe("p");
    });

    it("should sieve properly within passed-in options", () => {
      const instance = new TestCCommand([], {}, testDir);
      expect(instance.getOptions({ testOption2: "p" }, { testOption2: "p2" }).testOption2).toBe("p2");
    });

    it("should override everything with a CLI flag", () => {
      const instance = new TestCCommand([], {
        testOption2: "f",
      }, testDir);
      expect(instance.getOptions({ testOption2: "p" }).testOption2).toBe("f");
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
      class BootstrapCommand extends Command {
      }

      it("should warn when used", () => {
        const instance = new BootstrapCommand([], {}, testDir);
        const logWarn = jest.spyOn(instance.logger, "warn");

        instance.getOptions();
        expect(logWarn).lastCalledWith(
          "`bootstrapConfig.ignore` is deprecated.  Use `commands.bootstrap.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new BootstrapCommand([], {}, testDir);
        expect(instance.getOptions().ignore).toBe("package-a");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        const logWarn = jest.spyOn(instance.logger, "warn");

        instance.getOptions();
        expect(logWarn).not.toBeCalled();
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        expect(instance.getOptions().ignore).toBe(undefined);
      });
    });

    describe("publishConfig", () => {
      class PublishCommand extends Command {
      }

      it("should warn when used", () => {
        const instance = new PublishCommand([], {}, testDir);
        const logWarn = jest.spyOn(instance.logger, "warn");

        instance.getOptions();
        expect(logWarn).lastCalledWith(
          "`publishConfig.ignore` is deprecated.  Use `commands.publish.ignore`."
        );
      });

      it("should provide a correct value", () => {
        const instance = new PublishCommand([], {}, testDir);
        expect(instance.getOptions().ignore).toBe("package-b");
      });

      it("should not warn with other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        const logWarn = jest.spyOn(instance.logger, "warn");

        instance.getOptions();
        expect(logWarn).not.toBeCalled();
      });

      it("should not provide a value to other commands", () => {
        const instance = new TestCommand([], {}, testDir);
        expect(instance.getOptions().ignore).toBe(undefined);
      });
    });
  });

  describe("exposeCommands", () => {
    class FooCommand extends Command {
    }
    class BarCommand extends Command {
    }
    class BadClassName extends Command {
    }
    class NonCommand {
    }

    it("makes a mapping from command names to classes", () => {
      expect(exposeCommands([FooCommand, BarCommand])).toEqual({
        foo: FooCommand,
        bar: BarCommand,
      });
    });

    it("fails on bad class name", () => {
      expect(() => exposeCommands([BadClassName])).toThrow();
    });

    it("fails on duplicate class", () => {
      expect(() => exposeCommands([FooCommand, FooCommand])).toThrow();
    });

    it("fails on class that doesn't extend Command", () => {
      expect(() => exposeCommands([NonCommand])).toThrow();
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
