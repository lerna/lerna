"use strict";

const os = require("os");

module.exports = globalOptions;

function globalOptions(yargs) {
  // the global options applicable to _every_ command
  const opts = {
    loglevel: {
      defaultDescription: "info",
      describe: "What level of logs to report.",
      type: "string",
    },
    concurrency: {
      defaultDescription: os.cpus().length,
      describe: "How many processes to use when lerna parallelizes tasks.",
      type: "number",
      requiresArg: true,
    },
    "reject-cycles": {
      describe: "Fail if a cycle is detected among dependencies.",
      type: "boolean",
    },
    "no-progress": {
      describe: "Disable progress bars. (Always off in CI)",
      type: "boolean",
    },
    progress: {
      // proxy for --no-progress
      hidden: true,
      type: "boolean",
    },
    "no-sort": {
      describe: "Do not sort packages topologically (dependencies before dependents).",
      type: "boolean",
    },
    sort: {
      // proxy for --no-sort
      hidden: true,
      type: "boolean",
    },
    "max-buffer": {
      describe: "Set max-buffer (in bytes) for subcommand execution",
      type: "number",
      requiresArg: true,
    },
  };

  // group options under "Global Options:" header
  const globalKeys = Object.keys(opts).concat(["help", "version"]);

  return yargs
    .options(opts)
    .group(globalKeys, "Global Options:")
    .option("ci", {
      hidden: true,
      type: "boolean",
    });
}
