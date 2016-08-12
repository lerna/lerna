import assert from "assert";

import progressBar from "../src/progressBar";
import Command from "../src/Command";
import logger from "../src/logger";

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
    it.skip("should exist", (done) => {
      class TestCommand extends Command {
        initialize(callback) { callback(); }
        execute() {

          done();
        }
      }

      const testCommand = new TestCommand([], {});
      testCommand.run();
    });
  });
});
