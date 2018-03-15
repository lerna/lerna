"use strict";

const CreateCommand = require(".");

/**
 * @see https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module
 */
exports.command = "create <pkgName> [location]";

exports.describe = "Create a new lerna-managed package";

exports.builder = yargs => {
  yargs
    .positional("pkgName", {
      describe: "The package name, which must be locally unique _and_ publicly available",
      type: "string",
    })
    .positional("location", {
      describe: "A custom package location, defaulting to the first configured package location",
      type: "string",
    })
    .options({
      access: {
        group: "Command Options:",
        defaultDescription: "public",
        describe: "When using a scope, configure publishConfig.access ('public' or 'restricted')",
        implies: "scope",
      },
      bin: {
        group: "Command Options:",
        defaultDescription: "<pkgName>",
        describe: "Package has an executable. Customize with --bin <executableName>",
      },
      description: {
        group: "Command Options:",
        describe: "Package description",
        type: "string",
      },
      dependencies: {
        group: "Command Options:",
        describe: "A list of package dependencies",
        type: "array",
        default: [],
      },
      "dev-dependencies": {
        group: "Command Options:",
        describe: "A list of package devDependencies",
        type: "array",
        default: [],
      },
      "es-module": {
        describe: "Initialize a transpiled ES Module",
        type: "boolean",
      },
      keywords: {
        group: "Command Options:",
        describe: "A list of package keywords",
        type: "array",
      },
      outdir: {
        describe: "Transpile into this directory",
        type: "string",
        default: "lib",
        implies: "es-module",
      },
      private: {
        group: "Command Options:",
        describe: "Make the new package private, never published to any external registry",
        type: "boolean",
      },
      registry: {
        group: "Command Options:",
        describe: "Configure the package's publishConfig.registry",
        type: "string",
        requiresArg: true,
      },
      scope: {
        group: "Command Options:",
        describe: "A scope to prefix the package name, such as '@lerna'",
        type: "string",
      },
      tag: {
        group: "Command Options:",
        describe: "Configure the package's publishConfig.tag",
        type: "string",
        requiresArg: true,
      },
      yes: {
        group: "Command Options:",
        describe: "Skip all prompts, accepting default values",
        type: "boolean",
      },
    });

  return yargs;
};

exports.handler = function handler(argv) {
  return new CreateCommand(argv);
};
