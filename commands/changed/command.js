"use strict";

const publishOptions = require("@lerna/publish/command").builder;
const ChangedCommand = require(".");

exports.command = "changed";

exports.aliases = ["updated"];

exports.describe = "Check which packages have changed since the last publish.";

exports.builder = yargs =>
  publishOptions(yargs).options({
    json: {
      describe: "Show information in JSON format",
      group: "Command Options:",
      type: "boolean",
      default: undefined,
    },
  });

exports.handler = function handler(argv) {
  return new ChangedCommand(argv);
};
