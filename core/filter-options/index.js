"use strict";

const dedent = require("dedent");

module.exports = filterOptions;

function filterOptions(yargs) {
  // Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands
  const opts = {
    scope: {
      describe: "Include only packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
      coerce: arg => {
        // always return a list of globs
        if (!Array.isArray(arg)) {
          return [arg];
        }

        return arg;
      },
    },
    ignore: {
      describe: "Exclude packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
      coerce: arg => {
        // negate any globs passed
        if (!Array.isArray(arg)) {
          return [`!${arg}`];
        }

        return arg.map(str => `!${str}`);
      },
    },
    private: {
      describe: "Include private packages. Pass --no-private to exclude private packages.",
      type: "boolean",
      default: true,
    },
    since: {
      describe: dedent`
        Only include packages that have been updated since the specified [ref].
        If no ref is passed, it defaults to the most-recent tag.
      `,
      type: "string",
    },
    "include-filtered-dependencies": {
      describe: dedent`
        Include all transitive dependencies when running a command,
        regardless of --include, --exclude or --since.
      `,
      boolean: true,
    },
  };

  return yargs.options(opts).group(Object.keys(opts), "Filter Options:");
}
