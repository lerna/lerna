"use strict";

const chalk = require("chalk");
const columnify = require("columnify");

const Command = require("@lerna/command");
const output = require("@lerna/output");

module.exports = factory;

function factory(argv) {
  return new ListCommand(argv);
}

class ListCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    this.resultList = this.filteredPackages.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
    }));

    // logged after output
    this.count = this.resultList.length;
  }

  execute() {
    let result;

    if (this.options.json) {
      result = this.formatJSON();
    } else {
      result = this.formatColumns();
    }

    output(result);

    this.logger.success("found", "%d %s", this.count, this.count === 1 ? "package" : "packages");
  }

  formatJSON() {
    return JSON.stringify(this.resultList, null, 2);
  }

  formatColumns() {
    const formattedResults = this.resultList.map(result => {
      const formatted = {
        name: result.name,
      };

      if (result.version) {
        formatted.version = chalk.grey(`v${result.version}`);
      } else {
        formatted.version = chalk.yellow("MISSING");
      }

      if (result.private) {
        formatted.private = `(${chalk.red("private")})`;
      }

      return formatted;
    });

    return columnify(formattedResults, {
      showHeaders: false,
      config: {
        version: {
          align: "right",
        },
      },
    });
  }
}

module.exports.ListCommand = ListCommand;
