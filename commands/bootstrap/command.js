"use strict";

const filterable = require("@lerna/filter-options");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "bootstrap";

exports.describe = "Link local packages together and install remaining package dependencies";

exports.builder = yargs => {
  yargs
    .example(
      "$0 bootstrap -- --no-optional",
      "# execute `npm install --no-optional` in bootstrapped packages"
    )
    .options({
      hoist: {
        group: "Command Options:",
        describe: "Install external dependencies matching [glob] to the repo root",
        defaultDescription: "'**'",
      },
      nohoist: {
        group: "Command Options:",
        describe: "Don't hoist external dependencies matching [glob] to the repo root",
        type: "string",
        requiresArg: true,
      },
      mutex: {
        hidden: true,
        // untyped and hidden on purpose
      },
      "ignore-prepublish": {
        group: "Command Options:",
        describe: "Don't run prepublish lifecycle scripts in bootstrapped packages.",
        type: "boolean",
      },
      "ignore-scripts": {
        group: "Command Options:",
        describe: "Don't run _any_ lifecycle scripts in bootstrapped packages",
        type: "boolean",
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to install dependencies (npm, yarn, pnpm, ...)",
        type: "string",
        requiresArg: true,
      },
      registry: {
        group: "Command Options:",
        describe: "Use the specified registry for all npm client operations.",
        type: "string",
        requiresArg: true,
      },
      strict: {
        group: "Command Options:",
        describe: "Don't allow warnings when hoisting as it causes longer bootstrap times and other issues.",
        type: "boolean",
      },
    });

  return filterable(yargs);
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};
