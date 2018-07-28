"use strict";

const chalk = require("chalk");
const columnify = require("columnify");
const path = require("path");
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
    const alias = this.options._[0];

    this.showAll = alias === "la" || this.options.all;
    this.showLong = alias === "la" || alias === "ll" || this.options.long;

    this.resultList = this.showAll
      ? this.filteredPackages
      : this.filteredPackages.filter(pkg => !pkg.private);

    // logged after output
    this.count = this.resultList.length;
  }

  execute() {
    let result;

    if (this.options.json) {
      result = this.formatJSON();
    } else if (this.options.parseable) {
      result = this.formatParseable();
    } else {
      result = this.formatColumns();
    }

    output(result);

    this.logger.success("found", "%d %s", this.count, this.count === 1 ? "package" : "packages");
  }

  formatJSON() {
    // explicit re-mapping exposes non-enumerable properties
    const data = this.resultList.map(pkg => ({
      name: pkg.name,
      version: pkg.version,
      private: pkg.private,
      location: pkg.location,
    }));

    return JSON.stringify(data, null, 2);
  }

  formatParseable() {
    const mapper = this.showLong
      ? pkg => {
          const result = [pkg.location, pkg.name];

          // sometimes the version is inexplicably missing?
          if (pkg.version) {
            result.push(pkg.version);
          } else {
            result.push("MISSING");
          }

          if (pkg.private) {
            result.push("PRIVATE");
          }

          return result.join(":");
        }
      : pkg => pkg.location;

    return this.resultList.map(mapper).join("\n");
  }

  formatColumns() {
    const formattedResults = this.resultList.map(result => {
      const formatted = {
        name: result.name,
      };

      if (result.version) {
        formatted.version = chalk.green(`v${result.version}`);
      } else {
        formatted.version = chalk.yellow("MISSING");
      }

      if (result.private) {
        formatted.private = `(${chalk.red("PRIVATE")})`;
      }

      formatted.location = chalk.grey(path.relative(".", result.location));

      return formatted;
    });

    return columnify(formattedResults, {
      showHeaders: false,
      columns: this.getColumnOrder(),
      config: {
        version: {
          align: "right",
        },
      },
    });
  }

  getColumnOrder() {
    const columns = ["name"];

    if (this.showLong) {
      columns.push("version", "location");
    }

    if (this.showAll) {
      columns.push("private");
    }

    return columns;
  }
}

module.exports.ListCommand = ListCommand;
