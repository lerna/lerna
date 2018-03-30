"use strict";

const concat = require("concat-stream");
const log = require("npmlog");

module.exports = sawmill;

function sawmill() {
  // https://en.wikipedia.org/wiki/Log_flume
  const flume = new Promise((finish, fouled) => {
    // overrides default process.stderr, hiding logs during test execution
    log.stream = concat(finish).on("error", fouled);
  });

  return () => {
    // resolves the logs in flume
    log.stream.end();

    return flume;
  };
}
