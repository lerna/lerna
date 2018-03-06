"use strict";

const CleanCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "clean";

exports.describe = "Remove the node_modules directory from all packages.";

exports.builder = {
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts",
  },
};

exports.handler = function handler(argv) {
  return new CleanCommand(argv);
};
