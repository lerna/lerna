// @ts-check

"use strict";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "add-caching";

exports.describe = "Interactive prompt to generate task runner configuration";

exports.builder = (yargs) => {
  return yargs;
};

exports.handler = function handler(argv) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
