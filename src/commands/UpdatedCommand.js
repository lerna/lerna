"use strict";

const chalk = require("chalk");

const Command = require("../Command");
const output = require("../utils/output");
const publishOptions = require("./PublishCommand").builder;
const collectUpdates = require("../utils/collect-updates");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new UpdatedCommand(argv);
};

exports.command = "updated";

exports.describe = "Check which packages have changed since the last publish.";

exports.builder = yargs =>
  yargs.options(
    Object.assign({}, publishOptions, {
      json: {
        describe: "Show information in JSON format",
        group: "Command Options:",
        type: "boolean",
        default: undefined,
      },
    })
  );

class UpdatedCommand extends Command {
  get otherCommandConfigs() {
    return ["publish"];
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
  }

  initialize() {
    this.updates = collectUpdates(this);

    const proceedWithUpdates = this.updates.length > 0;

    if (!proceedWithUpdates) {
      this.logger.info("No packages need updating");

      process.exitCode = 1;
    }

    return proceedWithUpdates;
  }

  execute() {
    const updatedPackages = this.updates.map(({ pkg }) => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
    }));

    const formattedUpdates = this.options.json
      ? JSON.stringify(updatedPackages, null, 2)
      : updatedPackages
          .map(pkg => `- ${pkg.name}${pkg.private ? ` (${chalk.red("private")})` : ""}`)
          .join("\n");

    output(formattedUpdates);
  }
}
