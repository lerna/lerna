"use strict";

const LsCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "list";

exports.aliases = ["ls"];

exports.describe = "List local packages";

exports.builder = {
  json: {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  },
};

exports.handler = function handler(argv) {
  return new LsCommand(argv);
};
