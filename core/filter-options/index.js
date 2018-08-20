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
    },
    ignore: {
      describe: "Exclude packages with names matching the given glob.",
      type: "string",
    },
    private: {
      describe: "Include private packages.\nPass --no-private to exclude private packages.",
      type: "boolean",
      defaultDescription: "true",
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
