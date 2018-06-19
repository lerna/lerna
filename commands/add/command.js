"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "add <pkg> [globs..]";

exports.describe = "Add a dependency to matched packages";

exports.builder = yargs => {
  yargs
    .positional("pkg", {
      describe: "Package name to add as a dependency",
      type: "string",
    })
    .positional("globs", {
      describe: "Optional package directory globs to match",
      type: "array",
    })
    .options({
      dev: {
        group: "Command Options:",
        type: "boolean",
        alias: "D",
        describe: "Save to devDependencies",
      },
      exact: {
        group: "Command Options:",
        type: "boolean",
        alias: "E",
        describe: "Save version exactly",
      },
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
