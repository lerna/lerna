"use strict";

const filterable = require("@lerna/filter-options");
const listable = require("@lerna/listable");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "list";

exports.aliases = ["ls", "la", "ll"];

exports.describe = "List local packages";

exports.builder = yargs => {
  listable.options(yargs);

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
