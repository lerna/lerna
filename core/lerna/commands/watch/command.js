// @ts-check

"use strict";

const { filterOptions } = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "watch";

exports.describe = "Runs a command whenever packages or their dependents change.";

exports.builder = (yargs) => {
  return filterOptions(
    yargs.parserConfiguration({
      "populate--": true,
    })
  );
};

exports.handler = function handler(argv) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
