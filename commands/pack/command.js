"use strict";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "pack [spec..]";

exports.describe = "Create a tarball from Lerna-managed packages.";

/** @param {import("yargs").Argv} yargs */
exports.builder = function builder(yargs) {
  return yargs
    .positional("spec", {
      describe: "Optional package name or directory globs to pack",
      type: "array",
    })
    .options({
      "dry-run": {
        group: "Command Options:",
        describe: "Do not write files to disk, merely report what would have been packed.",
        type: "boolean",
      },
      "no-unicode": {
        group: "Command Options:",
        describe: "Do not use high Unicode characters when reporting package contents.",
        type: "boolean",
      },
      unicode: {
        // proxy for --no-unicode
        hidden: true,
        type: "boolean",
      },
    });
};

/** @typedef {ReturnType<typeof exports.builder>} PackArgv */

/** @param {PackArgv} argv */
exports.handler = function handler(argv) {
  return require("./lib/pack-command")(argv);
};
