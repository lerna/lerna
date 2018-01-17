"use strict";

const _ = require("lodash");

module.exports = filterFlags;

/**
 * Passed argv from yargs, return an object that contains _only_
 * what was passed on the command line, omitting undefined values
 * and yargs spam.
 */
function filterFlags(argv) {
  return _.omit(_.omitBy(argv, _.isNil), ["h", "help", "v", "version", "$0", "onRejected"]);
}
