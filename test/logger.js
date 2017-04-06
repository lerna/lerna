// using CommonJS because we need to
// modify chalk properties before the
// logger singleton caches them :P
const chalk = require("chalk");

// keep assertions stable cross-platform
chalk.enabled = false;

// file under test
const logger = require("../src/logger");

describe("logger", () => {
  it("should exist", () => {
    expect(logger).toBeDefined();
  });

  describe("log levels", () => {
    const _emit = logger._emit;
    let emitSpy;

    beforeEach(() => {
      emitSpy = jest.spyOn(logger, "_emit").mockImplementation(() => {});
    });

    afterEach(() => {
      logger._emit = _emit;
      logger.setLogLevel();
    });

    it("should suppress verbose by default", () => {
      logger.verbose("test default");
      expect(emitSpy).not.toBeCalled();
    });

    it("should emit verbose if configured", () => {
      logger.setLogLevel("verbose");
      logger.verbose("test verbose");
      expect(emitSpy).lastCalledWith("test verbose");
    });

    it("should emit error by default", () => {
      logger.error("test error");
      expect(emitSpy).lastCalledWith("test error");
    });

    it("should suppress error if silent", () => {
      logger.setLogLevel("silent");
      logger.error("test silent");
      expect(emitSpy).not.toBeCalled();
    });
  });
});
