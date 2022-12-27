/* eslint-disable @typescript-eslint/no-var-requires */

"use strict";

import type { Arguments, Argv } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "add-caching";

exports.describe = "Interactive prompt to generate task runner configuration";

exports.builder = (yargs: Argv) => {
  return yargs;
};

exports.handler = function handler(argv: Arguments) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
