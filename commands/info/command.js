"use strict";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "info";

exports.describe = "Prints debugging information about the local environment";

exports.handler = function handler(argv) {
  return require(".")(argv);
};
