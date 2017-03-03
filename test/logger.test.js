import assert from "assert";
import stub from "./helpers/stub";

import logger from "../src/logger";

describe("logger", () => {
  it("should exist", () => {
    assert.ok(logger);
  });
  describe("log levels", () => {
    let called;
    beforeEach(() => {
      called = false;
      stub(logger, "_emit", () => called = true);
    });
    afterEach(() => logger.setLogLevel());

    it("should suppress verbose by default", () => {
      logger.verbose("test");
      assert.ok(!called);
    });
    it("should emit verbose if configured", () => {
      logger.setLogLevel("verbose");
      logger.verbose("test");
      assert.ok(called);
    });
    it("should emit error by default", () => {
      logger.error("test");
      assert.ok(called);
    });
    it("should suppress error if silent", () => {
      logger.setLogLevel("silent");
      logger.error("test");
      assert.ok(!called);
    });
  });
});
