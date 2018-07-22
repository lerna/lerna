"use strict";

const chalk = require("chalk");

const Command = require("@lerna/command");
const collectUpdates = require("@lerna/collect-updates");
const output = require("@lerna/output");

module.exports = factory;

function factory(argv) {
  return new ChangedCommand(argv);
}

class ChangedCommand extends Command {
  get otherCommandConfigs() {
    return ["publish"];
  }

  initialize() {
    this.updates = collectUpdates(this);
    this.count = this.updates.length;

    const proceedWithUpdates = this.count > 0;

    if (!proceedWithUpdates) {
      this.logger.info("", "No changed packages found");

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

    this.logger.success(
      "found",
      "%d %s ready to publish",
      this.count,
      this.count === 1 ? "package" : "packages"
    );
  }
}

module.exports.ChangedCommand = ChangedCommand;
