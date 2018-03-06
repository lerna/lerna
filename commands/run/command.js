"use strict";

const filterable = require("@lerna/filter-options");
const RunCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "run <script>";

exports.describe = "Run an npm script in each package that contains that script.";

exports.builder = yargs => {
  yargs
    .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
    .options({
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
        default: undefined,
      },
      parallel: {
        group: "Command Options:",
        describe: "Run script in all packages with unlimited concurrency, streaming prefixed output.",
        type: "boolean",
        default: undefined,
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to run scripts (npm, yarn, pnpm, ...).",
        type: "string",
        requiresArg: true,
      },
    })
    .positional("script", {
      describe: "The npm script to run. Pass flags to send to the npm client after --",
      type: "string",
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return new RunCommand(argv);
};
