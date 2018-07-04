"use strict";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "diff [pkgName]";

exports.describe = "Diff all packages or a single package since the last release";

exports.builder = yargs =>
  yargs
    .positional("pkgName", {
      describe: "An optional package name to filter the diff output",
    })
    .options({
      "ignore-changes": {
        group: "Command Options:",
        describe: "Ignore changes in files matched by glob(s).",
        type: "array",
      },
    })
    .epilogue(
      "When ignoreChanges is configured in lerna.json, pass --no-ignore-changes to include ignored files."
    );

exports.handler = function handler(argv) {
  return require(".")(argv);
};
