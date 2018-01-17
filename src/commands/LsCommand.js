"use strict";

const chalk = require("chalk");
const columnify = require("columnify");

const Command = require("../Command");
const output = require("../utils/output");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new LsCommand(argv);
};

exports.command = "ls";

exports.describe = "List all public packages";

exports.builder = {
  json: {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined,
  },
};

class LsCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      json: false,
    });
  }

  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    const formattedPackages = this.filteredPackages.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.isPrivate(),
    }));

    if (this.options.json) {
      output(JSON.stringify(formattedPackages, null, 2));
    } else {
      formattedPackages.forEach(pkg => {
        pkg.version = pkg.version ? chalk.grey(`v${pkg.version}`) : chalk.yellow("MISSING");
        pkg.private = pkg.private ? `(${chalk.red("private")})` : "";
      });
      output(
        columnify(formattedPackages, {
          showHeaders: false,
          config: {
            version: {
              align: "right",
            },
          },
        }),
      );
    }

    callback(null, true);
  }
}
