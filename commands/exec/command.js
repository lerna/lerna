"use strict";

const filterable = require("@lerna/filter-options");
const ExecCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "exec [cmd] [args..]";

exports.describe = "Run an arbitrary command in each package.";

exports.builder = yargs => {
  yargs
    .example("$0 exec ls -- --la", "# execute `ls -la` in all packages")
    .example("$0 exec -- ls --la", "# execute `ls -la` in all packages, keeping cmd outside")
    .positional("cmd", {
      describe: "The command to execute. Any command flags must be passed after --",
      type: "string",
    })
    .positional("args", {
      describe: "Positional arguments (not recognized by lerna) to send to command",
      type: "string",
    })
    .options({
      bail: {
        group: "Command Options:",
        describe: "Bail on exec execution when the command fails within a package",
        type: "boolean",
        default: undefined,
      },
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
        default: undefined,
      },
      parallel: {
        group: "Command Options:",
        describe: "Run command in all packages with unlimited concurrency, streaming prefixed output",
        type: "boolean",
        default: undefined,
      },
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return new ExecCommand(argv);
};
