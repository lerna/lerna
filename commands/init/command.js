"use strict";

const InitCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "init";

exports.describe = "Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.";

exports.builder = {
  exact: {
    describe: "Specify lerna dependency version in package.json without a caret (^)",
    type: "boolean",
    default: undefined,
  },
  independent: {
    describe: "Version packages independently",
    alias: "i",
    type: "boolean",
    default: undefined,
  },
};

exports.handler = function handler(argv) {
  return new InitCommand(argv);
};
