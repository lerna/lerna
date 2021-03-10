"use strict";

module.exports.listableOptions = listableOptions;

/**
 * @typedef {object} ListableOptions Because yargs.InferredOptionsTypes is next to useless here
 * @property {boolean} json
 * @property {boolean} ndjson
 * @property {boolean} all
 * @property {boolean} long
 * @property {boolean} parseable
 * @property {boolean} toposort
 * @property {boolean} graph
 */

/**
 * Add list-related options to a Yargs instance.
 * @param {import("yargs").Argv} yargs
 * @param {string} [group]
 */
function listableOptions(yargs, group = "Command Options:") {
  return yargs.options({
    json: {
      group,
      describe: "Show information as a JSON array",
      type: "boolean",
    },
    ndjson: {
      group,
      describe: "Show information as newline-delimited JSON",
      type: "boolean",
    },
    a: {
      group,
      describe: "Show private packages that are normally hidden",
      type: "boolean",
      alias: "all",
    },
    l: {
      group,
      describe: "Show extended information",
      type: "boolean",
      alias: "long",
    },
    p: {
      group,
      describe: "Show parseable output instead of columnified view",
      type: "boolean",
      alias: "parseable",
    },
    toposort: {
      group,
      describe: "Sort packages in topological order instead of lexical by directory",
      type: "boolean",
    },
    graph: {
      group,
      describe: "Show dependency graph as a JSON-formatted adjacency list",
      type: "boolean",
    },
  });
}
