"use strict";

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
      defaultDescription: "4",
      describe: "How many processes to use when lerna parallelizes tasks.",
      type: "number",
      requiresArg: true,
    },
    "reject-cycles": {
      describe: "Fail if a cycle is detected among dependencies.",
      type: "boolean",
    },
    progress: {
      defaultDescription: "true",
      describe: "Enable progress bars. (Always off in CI)\nPass --no-progress to disable.",
      type: "boolean",
    },
    sort: {
      defaultDescription: "true",
      describe: "Sort packages topologically (dependencies before dependents).\nPass --no-sort to disable.",
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
