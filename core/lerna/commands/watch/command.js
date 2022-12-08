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
    .option("includeGlobalWorkspaceFiles", {
      type: "boolean",
      description:
        "Include global workspace files that are not part of a package. For example, the root eslint, or tsconfig file.",
      alias: "g",
    })
    .option("callback", { type: "string", hidden: true })
    .option("verbose", {
      type: "boolean",
      description: "Run watch mode in verbose mode, where commands are logged before execution.",
    })
    .middleware((args) => {
      const { "--": underscore } = args;
      args.callback = underscore?.[0];
    }, true);

  return filterOptions(yargs);
};

exports.handler = function handler(argv) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
