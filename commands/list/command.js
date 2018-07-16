"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "list";

exports.aliases = ["ls"];

exports.describe = "List local packages";

exports.builder = yargs => {
  yargs.options({
    json: {
      group: "Command Options:",
      describe: "Show information in JSON format",
      type: "boolean",
    },
  });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
