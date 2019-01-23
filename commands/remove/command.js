"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "remove <pkg> [globs..]";

exports.describe = "Remove a single dependency to matched packages";

exports.builder = yargs => {
  yargs
    .positional("pkg", {
      describe: "Package name to add as a dependency",
      type: "string",
    })
    .positional("globs", {
      describe: "Optional package directory globs to match",
      type: "array",
    })
    .options({
      registry: {
        group: "Command Options:",
        describe: "Use the specified registry for all npm client operations.",
        type: "string",
        requiresArg: true,
      },
    })
    .example(
      "$0 remove module-1 packages/prefix-*",
      "Removes module-1 package from the packages in the 'prefix-' prefixed folders"
    )
    .example("$0 remove module-1 --scope=module-2", "Removes module-1 from module-2")
    .example("$0 remove module-1", "Removes module-1 from all modules except module-1")
    .example("$0 remove babel-core", "Removes babel-core in all modules");

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
