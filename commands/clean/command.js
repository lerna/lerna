"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "clean";

exports.describe = "Remove the node_modules directory from all packages";

exports.builder = yargs => {
  yargs.options({
    y: {
      group: "Command Options:",
      describe: "Skip all confirmation prompts",
      alias: "yes",
      type: "boolean",
    },
  });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
