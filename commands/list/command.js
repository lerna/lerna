"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "list";

exports.aliases = ["ls", "la", "ll"];

exports.describe = "List local packages";

exports.builder = yargs => {
  yargs.options({
    json: {
      group: "Command Options:",
      describe: "Show information as a JSON array",
      type: "boolean",
    },
    a: {
      group: "Command Options:",
      describe: "Show private packages that are normally hidden",
      type: "boolean",
      alias: "all",
    },
    l: {
      group: "Command Options:",
      describe: "Show extended information",
      type: "boolean",
      alias: "long",
    },
    p: {
      group: "Command Options:",
      describe: "Show parseable output instead of columnified view",
      type: "boolean",
      alias: "parseable",
    },
  });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
