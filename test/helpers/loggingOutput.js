"use strict";

const _ = require("lodash");
const log = require("npmlog");

module.exports = loggingOutput;

// clear logs between tests
afterEach(() => {
  log.record.length = 0;
});

const getVisibleMessages = _.flow(
  list =>
    _.filter(
      list,
      m =>
        // select all info, warn, and error logs
        log.levels[m.level] >= log.levels.info
    ),
  list => _.map(list, "message"),
  // remove empty logs ("newline")
  _.compact
);

function loggingOutput() {
  return getVisibleMessages(log.record);
}
