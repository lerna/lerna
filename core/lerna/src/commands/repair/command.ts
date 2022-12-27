/* eslint-disable @typescript-eslint/no-var-requires */

"use strict";

import type { Arguments, Argv } from "yargs";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "repair";

exports.describe = "Runs automated migrations to repair the state of a lerna repo";

exports.builder = (yargs: Argv) => {
  yargs.options({
    /**
     * equivalent to --loglevel=verbose, but added explicitly here because the repair()
     * output will potentially contain instructions to run with --verbose
     */
    verbose: {
      hidden: true,
      type: "boolean",
    },
  });
  return yargs;
};

exports.handler = function handler(argv: Arguments) {
  // eslint-disable-next-line global-require
  return require(".")(argv);
};
