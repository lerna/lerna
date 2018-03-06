"use strict";

const log = require("npmlog");
const normalizeNewline = require("normalize-newline");

module.exports = loggingOutput;

// clear logs between tests
afterEach(() => {
  log.record.length = 0;
});

function loggingOutput(minLevel = "info") {
  // returns an array of log messages at or above the prescribed minLevel
  return (
    log.record
      // select all non-empty info, warn, or error logs
      .filter(m => log.levels[m.level] >= log.levels[minLevel] && m.message)
      // return just the normalized message content
      .map(m =>
        normalizeNewline(m.message)
          .split("\n")
          .map(line => line.trimRight())
          .join("\n")
      )
  );
}
