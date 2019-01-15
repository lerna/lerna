"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "exec [cmd] [args..]";

exports.describe = "Execute an arbitrary command in each package";

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
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by originating package name.",
        type: "boolean",
      },
      parallel: {
        group: "Command Options:",
        describe: "Execute command with unlimited concurrency, streaming prefixed output.",
        type: "boolean",
      },
      "no-bail": {
        group: "Command Options:",
        describe: "Continue executing command despite non-zero exit in a given package.",
        type: "boolean",
      },
      bail: {
        // proxy for --no-bail
        hidden: true,
        type: "boolean",
      },
      // This option controls prefix for stream output so that it can be disabled to be friendly
      // to tools like Visual Studio Code to highlight the raw results
      "no-prefix": {
        group: "Command Options:",
        describe: "Do not prefix streaming output.",
        type: "boolean",
      },
      prefix: {
        // proxy for --no-prefix
        hidden: true,
        type: "boolean",
      },
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
