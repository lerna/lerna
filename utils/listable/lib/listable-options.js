"use strict";

module.exports = listableOptions;

function listableOptions(yargs) {
  return yargs.options({
    json: {
      group: "Command Options:",
      describe: "Show information as a JSON array",
      type: "boolean",
    },
    a: {
      group: "Command Options:",
      describe: "Show private packages that are normally hidden",
      type: "boolean",
      alias: "all",
    },
    l: {
      group: "Command Options:",
      describe: "Show extended information",
      type: "boolean",
      alias: "long",
    },
    p: {
      group: "Command Options:",
      describe: "Show parseable output instead of columnified view",
      type: "boolean",
      alias: "parseable",
    },
  });
}
