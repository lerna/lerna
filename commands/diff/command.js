"use strict";

const DiffCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "diff [pkgName]";

exports.describe = "Diff all packages or a single package since the last release.";

exports.builder = yargs =>
  yargs.positional("pkgName", {
    describe: "An optional package name to filter the diff output",
  });

exports.handler = function handler(argv) {
  return new DiffCommand(argv);
};
