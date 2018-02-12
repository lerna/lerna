"use strict";

const _ = require("lodash");
const chalk = require("chalk");

const Command = require("../Command");
const output = require("../utils/output");
const publishOptions = require("./PublishCommand").builder;
const UpdatedPackagesCollector = require("../UpdatedPackagesCollector");

const updatedOptions = _.assign({}, publishOptions, {
  json: {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  },
});

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new UpdatedCommand(argv);
};

exports.command = "updated";

exports.describe = "Check which packages have changed since the last publish.";

exports.builder = yargs => yargs.options(updatedOptions);

class UpdatedCommand extends Command {
  initialize(callback) {
    this.updates = new UpdatedPackagesCollector(this).getUpdates();

    const proceedWithUpdates = this.updates.length > 0;
    if (!proceedWithUpdates) {
      this.logger.info("No packages need updating");
    }

    callback(null, proceedWithUpdates, 1);
  }

  get otherCommandConfigs() {
    return ["publish"];
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
  }

  execute(callback) {
    const updatedPackages = this.updates.map(update => update.package).map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
    }));

    this.logger.info("result");
    if (this.options.json) {
      output(JSON.stringify(updatedPackages, null, 2));
    } else {
      const formattedUpdates = updatedPackages
        .map(pkg => `- ${pkg.name}${pkg.private ? ` (${chalk.red("private")})` : ""}`)
        .join("\n");
      output(formattedUpdates);
    }

    callback(null, true);
  }
}
