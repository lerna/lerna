"use strict";

const listable = require("@lerna/listable");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "changed";

exports.aliases = ["updated"];

exports.describe = "List local packages that have changed since the last tagged release";

exports.builder = yargs => {
  const opts = {
    // only the relevant bits from `lerna version`
    "conventional-commits": {
      // fallback for overzealous --conventional-graduate
      hidden: true,
      type: "boolean",
    },
    "conventional-graduate": {
      describe: "Detect currently prereleased packages that would change to a non-prerelease version.",
      // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
    },
    "force-publish": {
      describe: "Always include targeted packages when detecting changed packages, skipping default logic.",
      // type must remain ambiguous because it is overloaded (boolean _or_ string _or_ array)
    },
    "ignore-changes": {
      describe: [
        "Ignore changes in files matched by glob(s) when detecting changed packages.",
        "Pass --no-ignore-changes to completely disable.",
      ].join("\n"),
      type: "array",
    },
    "include-merged-tags": {
      describe: "Include tags from merged branches when detecting changed packages.",
      type: "boolean",
    },
  };

  yargs.options(opts).group(Object.keys(opts), "Command Options:");

  return listable.options(yargs, "Output Options:");
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
