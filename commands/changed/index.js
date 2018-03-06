"use strict";

const chalk = require("chalk");

const Command = require("@lerna/command");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");

class ChangedCommand extends Command {
  get otherCommandConfigs() {
    return ["publish"];
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
  }

  initialize() {
    // don't interrupt stdio
    this.logger.disableProgress();

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

module.exports = ChangedCommand;
