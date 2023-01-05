// @ts-check

"use strict";

const { filterOptions } = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "watch";

exports.describe = "Runs a command whenever packages or their dependents change.";

exports.builder = (yargs) => {
  yargs
    .parserConfiguration({
      "populate--": true,
      "strip-dashed": true,
    })
    .option("command", { type: "string", hidden: true })
    .option("verbose", {
      type: "boolean",
      description: "Run watch mode in verbose mode, where commands are logged before execution.",
    })
    .middleware((args) => {
      const { "--": doubleDash } = args;
      if (doubleDash && Array.isArray(doubleDash)) {
        // eslint-disable-next-line no-param-reassign
        args.command = doubleDash.join(" ");
      }
    }, true);

  return filterOptions(yargs);
};

exports.handler = function handler(argv) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
