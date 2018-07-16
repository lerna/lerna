"use strict";

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "link";

exports.describe = "Symlink together all packages that are dependencies of each other";

exports.builder = yargs => {
  yargs.options({
    "force-local": {
      group: "Command Options:",
      describe: "Force local sibling links regardless of version range match",
      type: "boolean",
    },
  });

  return yargs.command(
    "convert",
    "Replace local sibling version ranges with relative file: specifiers",
    () => {},
    handler
  );
};

exports.handler = handler;
function handler(argv) {
  return require(".")(argv);
}
