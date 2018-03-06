"use strict";

const LinkCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "link";

exports.describe = "Symlink together all packages which are dependencies of each other";

exports.builder = {
  "force-local": {
    group: "Command Options:",
    describe: "Force local",
    type: "boolean",
    default: undefined,
  },
};

exports.handler = function handler(argv) {
  return new LinkCommand(argv);
};
