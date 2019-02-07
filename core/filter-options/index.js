"use strict";

const dedent = require("dedent");
const getFilteredPackages = require("./lib/get-filtered-packages");

module.exports = filterOptions;
module.exports.getFilteredPackages = getFilteredPackages;

function filterOptions(yargs) {
  // Only for 'run', 'exec', 'clean', 'ls', and 'bootstrap' commands
  const opts = {
    scope: {
      describe: "Include only packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
    },
    ignore: {
      describe: "Exclude packages with names matching the given glob.",
      type: "string",
      requiresArg: true,
    },
    "no-private": {
      describe: 'Exclude packages with { "private": true } in their package.json.',
      type: "boolean",
    },
    private: {
      // proxy for --no-private
      hidden: true,
      type: "boolean",
    },
    since: {
      describe: dedent`
        Only include packages that have been updated since the specified [ref].
        If no ref is passed, it defaults to the most-recent tag.
      `,
      type: "string",
    },
    "include-filtered-dependents": {
      describe: dedent`
        Include all transitive dependents when running a command
        regardless of --scope, --ignore, or --since.
      `,
      type: "boolean",
    },
    "include-filtered-dependencies": {
      describe: dedent`
        Include all transitive dependencies when running a command
        regardless of --scope, --ignore, or --since.
      `,
      type: "boolean",
    },
  };

  return yargs.options(opts).group(Object.keys(opts), "Filter Options:");
}
