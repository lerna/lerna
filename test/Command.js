import assert from "assert";

import progressBar from "../src/progressBar";
import initFixture from "./_initFixture";
import Command from "../src/Command";
import {exposeCommands} from "../src/Command";
import logger from "../src/logger";
import stub from "./_stub";

describe("Command", () => {
  describe(".input", () => {
    it("should be added to the instance", () => {
      const command = new Command(["a", "b", "c"]);
      assert.deepEqual(command.input, ["a", "b", "c"]);
    });
  });

  describe(".flags", () => {
    it("should be added to the instance", () => {
      const command = new Command(null, { foo: "bar" });
      assert.deepEqual(command.flags, { foo: "bar" });
    });
  });

  describe(".lernaVersion", () => {
    it("should be added to the instance", () => {
      const command = new Command();
      assert.deepEqual(command.lernaVersion, require("../package.json").version);
    });
  });

  describe(".progressBar", () => {
    it("should be added to the instance", () => {
      const command = new Command();
      assert.equal(command.progressBar, progressBar);
    });
  });

  describe(".logger", () => {
    it("should be added to the instance", () => {
      const command = new Command();
      assert.equal(command.logger, logger);
    });
  });

  describe(".concurrency", () => {
    it("should be added to the instance", () => {
      const command = new Command(null, {concurrency: 6});
      assert.equal(command.concurrency, 6);
    });

    it("should fall back to default if concurrency given is NaN", () => {
      const command = new Command(null, {concurrency: "bla"});
      assert.equal(command.concurrency, 4);
    });

    it("should fall back to default if concurrency given is 0", () => {
      assert.equal(new Command(null, {concurrency: 0}).concurrency, 4);
    });

    it("should fall back to 1 if concurrency given is smaller than 1", () => {
      assert.equal(new Command(null, {concurrency: -1}).concurrency, 1);
    });
  });

  describe(".run()", () => {
    it("should exist", (done) => {
      class TestCommand extends Command {
        initialize(callback) { callback(null, true); }
        execute() {

          done();
        }
      }

      const testCommand = new TestCommand([], {});
      testCommand.run();
    });
  });

  describe(".getOptions()", () => {
    beforeEach((done) => {
      initFixture("Command/basic", done);
    });

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
      assert.equal(new TestACommand([], {}).getOptions().testOption, "default");
    });

    it("should override global options with command-level options", () => {
      assert.equal(new TestBCommand([], {}).getOptions().testOption, "b");
    });

    it("should override global options with inherited command-level options", () => {
      assert.equal(new TestCCommand([], {}).getOptions().testOption, "b");
    });

    it("should override inherited command-level options with local command-level options", () => {
      assert.equal(new TestCCommand([], {}).getOptions().testOption2, "c");
    });

    it("should override command-level options with passed-in options", () => {
      assert.equal(new TestCCommand([], {}).getOptions({testOption2: "p"}).testOption2, "p");
    });

    it("should sieve properly within passed-in options", () => {
      assert.equal(new TestCCommand([], {}).getOptions({testOption2: "p"}, {testOption2: "p2"}).testOption2, "p2");
    });

    it("should override everything with a CLI flag", () => {
      assert.equal(new TestCCommand([], {testOption2: "f"}).getOptions({testOption2: "p"}).testOption2, "f");
    });

  });

  describe("legacy options", () => {
    beforeEach((done) => {
      initFixture("Command/legacy", done);
    });

    class TestCommand extends Command {
    }

    describe("bootstrapConfig", () => {
      class BootstrapCommand extends Command {
      }
      it("should warn when used", () => {
        let called = false;
        stub(logger, "warn", (message) => {
          called = true;
          assert.equal(message, "`bootstrapConfig.ignore` is deprecated.  Use `commands.bootstrap.ignore`.");
        });
        new BootstrapCommand([], {}).getOptions();
        assert.ok(called, "warning was emitted");
      });
      it("should provide a correct value", () => {
        assert.equal(new BootstrapCommand([], {}).getOptions().ignore, "package-a");
      });
      it("should not warn with other commands", () => {
        let called = false;
        stub(logger, "warn", () => called = true);
        new TestCommand([], {}).getOptions();
        assert.ok(!called, "no warning was emitted");
      });
      it("should not provide a value to other commands", () => {
        assert.equal(new TestCommand([], {}).getOptions().ignore, undefined);
      });
    });

    describe("publishConfig", () => {
      class PublishCommand extends Command {
      }
      it("should warn when used", () => {
        let called = false;
        stub(logger, "warn", (message) => {
          called = true;
          assert.equal(message, "`publishConfig.ignore` is deprecated.  Use `commands.publish.ignore`.");
        });
        new PublishCommand([], {}).getOptions();
        assert.ok(called, "warning was emitted");
      });
      it("should provide a correct value", () => {
        assert.equal(new PublishCommand([], {}).getOptions().ignore, "package-b");
      });
      it("should not warn with other commands", () => {
        let called = false;
        stub(logger, "warn", () => called = true);
        new TestCommand([], {}).getOptions();
        assert.ok(!called, "no warning was emitted");
      });
      it("should not provide a value to other commands", () => {
        assert.equal(new TestCommand([], {}).getOptions().ignore, undefined);
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
      assert.deepEqual(exposeCommands({}, [FooCommand, BarCommand]), {
        foo: FooCommand,
        bar: BarCommand,
      });
    });
    it("mutates the mapping that's passed in", () => {
      const mapping = {};
      exposeCommands(mapping, [FooCommand, BarCommand]);
      assert.deepEqual(mapping, {
        foo: FooCommand,
        bar: BarCommand,
      });
    });
    it("fails on bad class name", () => {
      assert.throws(() => exposeCommands({}, [BadClassName]));
    });
    it("fails on duplicate class", () => {
      assert.throws(() => exposeCommands({}, [FooCommand, FooCommand]));
    });
    it("fails on class that doesn't extend Command", () => {
      assert.throws(() => exposeCommands({}, [NonCommand]));
    });
  });
});
