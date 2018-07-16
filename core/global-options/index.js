"use strict";

module.exports = globalOptions;

function globalOptions(yargs, { ci = false, loglevel = "info", progress = true }) {
  // the global options applicable to _every_ command
  const opts = {
    loglevel: {
      default: loglevel,
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
      default: !ci && progress,
      describe: "Enable progress bars. Pass --no-progress to disable. (Always off in CI)",
      type: "boolean",
    },
    sort: {
      default: true,
      describe: "Sort packages topologically (all dependencies before dependents).",
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
      default: ci,
      hidden: true,
      type: "boolean",
    });
}
