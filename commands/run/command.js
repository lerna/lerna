"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "run <script>";

exports.describe = "Run an npm script in each package that contains that script";

exports.builder = yargs => {
  yargs
    .example("$0 run build -- --silent", "# `npm run build --silent` in all packages with a build script")
    .positional("script", {
      describe: "The npm script to run. Pass flags to send to the npm client after --",
      type: "string",
    })
    .options({
      bail: {
        group: "Command Options:",
        describe: "Stop when the script fails in a package.\nPass --no-bail to continue despite failure.",
        defaultDescription: "true",
        type: "boolean",
      },
      stream: {
        group: "Command Options:",
        describe: "Stream output with lines prefixed by package.",
        type: "boolean",
      },
      parallel: {
        group: "Command Options:",
        describe: "Run script in all packages with unlimited concurrency, streaming prefixed output.",
        type: "boolean",
      },
      // This option controls prefix for stream output so that it can be disabled to be friendly
      // to tools like Visual Studio Code to highlight the raw results
      prefix: {
        group: "Command Options:",
        describe: "Pass --no-prefix to disable prefixing of streamed output.",
        defaultDescription: "true",
        type: "boolean",
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to run scripts (npm, yarn, pnpm, ...).",
        defaultDescription: "npm",
        type: "string",
        requiresArg: true,
      },
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
