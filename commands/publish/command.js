"use strict";

const versionCommand = require("@lerna/version/command");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "publish [bump]";

exports.describe = "Publish packages in the current project.";

exports.builder = yargs => {
  const opts = {
    c: {
      describe: "Publish packages after every successful merge using the sha as part of the tag.",
      alias: "canary",
      type: "boolean",
    },
    // preid is copied from ../version/command because a whitelist for one option isn't worth it
    preid: {
      describe: "Specify the prerelease identifier when publishing a prerelease",
      type: "string",
      requiresArg: true,
      defaultDescription: "alpha",
    },
    "npm-tag": {
      describe: "Publish packages with the specified npm dist-tag",
      type: "string",
      requiresArg: true,
    },
    "npm-client": {
      defaultDescription: "npm",
      describe: "Executable used to publish dependencies (npm, yarn, pnpm, ...)",
      type: "string",
      requiresArg: true,
    },
    registry: {
      describe: "Use the specified registry for all npm client operations.",
      type: "string",
      requiresArg: true,
    },
    "require-scripts": {
      describe: "Execute ./scripts/prepublish.js and ./scripts/postpublish.js, relative to package root.",
      type: "boolean",
    },
    "temp-tag": {
      describe: "Create a temporary tag while publishing.",
      type: "boolean",
    },
    "verify-access": {
      describe: "Verify package read-write access for current npm user.\nPass --no-verify-access to disable.",
      type: "boolean",
      defaultDescription: "true",
    },
    y: {
      describe: "Skip all confirmation prompts.",
      alias: "yes",
      type: "boolean",
    },
  };

  return composeVersionOptions(yargs)
    .options(opts)
    .group(Object.keys(opts), "Command Options:")
    .option("verify-registry", {
      // TODO: remove in next major release
      hidden: true,
      type: "boolean",
    })
    .option("skip-npm", {
      // TODO: remove in next major release
      // deprecation notice handled in initialize()
      hidden: true,
      type: "boolean",
    });
};

exports.handler = function handler(argv) {
  return require(".")(argv);
};

function composeVersionOptions(yargs) {
  versionCommand.addBumpPositional(yargs, ["from-git"]);
  versionCommand.builder(yargs, "publish");

  return yargs;
}
