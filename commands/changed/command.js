"use strict";

const publishOptions = require("@lerna/publish/command").builder;

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "changed";

exports.aliases = ["updated"];

exports.describe = "Check which packages have changed since the last publish";

exports.builder = yargs =>
  publishOptions(yargs).options({
    json: {
      describe: "Show information in JSON format",
      group: "Command Options:",
      type: "boolean",
    },
  });

exports.handler = function handler(argv) {
  return require(".")(argv);
};
