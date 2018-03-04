"use strict";

const dedent = require("dedent");

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
      describe: "How many threads to use if lerna parallelises the tasks.",
      type: "number",
      requiresArg: true,
    },
    scope: {
      describe: dedent`
        Restricts the scope to package names matching the given glob.
        (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
      `,
      type: "string",
      requiresArg: true,
    },
    since: {
      describe: dedent`
        Restricts the scope to the packages that have been updated since
        the specified [ref], or if not specified, the latest tag.
        (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
      `,
      type: "string",
    },
    ignore: {
      describe: dedent`
        Ignore packages with names matching the given glob.
        (Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands)
      `,
      type: "string",
      requiresArg: true,
    },
    "include-filtered-dependencies": {
      describe: dedent`
        Include all transitive dependencies when running a command,
        regardless of --scope, --since or --ignore.
      `,
    },
    "reject-cycles": {
      describe: "Fail if a cycle is detected among dependencies",
      type: "boolean",
      default: undefined,
    },
    sort: {
      describe: "Sort packages topologically (all dependencies before dependents)",
      type: "boolean",
      default: undefined,
    },
    "max-buffer": {
      describe: "Set max-buffer(bytes) for Command execution",
      type: "number",
      requiresArg: true,
    },
  };

  // group options under "Global Options:" header
  const globalKeys = Object.keys(opts).concat(["help", "version"]);

  return yargs.options(opts).group(globalKeys, "Global Options:");
}
