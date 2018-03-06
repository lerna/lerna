"use strict";

const dedent = require("dedent");
const ImportCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "import <dir>";

exports.describe = dedent`
  Import the package in <dir> into packages/<dir> with commit history.
`;

exports.builder = yargs =>
  yargs
    .options({
      yes: {
        group: "Command Options:",
        describe: "Skip all confirmation prompts",
      },
      flatten: {
        group: "Command Options:",
        describe: "Import each merge commit as a single change the merge introduced",
      },
    })
    .positional("dir", { describe: "The path to an external git repository that contains an npm package" });

exports.handler = function handler(argv) {
  return new ImportCommand(argv);
};
