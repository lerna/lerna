"use strict";

const Command = require("@lerna/command");
const listable = require("@lerna/listable");
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
    this.result = listable.format(this.filteredPackages, this.options);
  }

  execute() {
    output(this.result.text);

    this.logger.success(
      "found",
      "%d %s",
      this.result.count,
      this.result.count === 1 ? "package" : "packages"
    );
  }
}

module.exports.ListCommand = ListCommand;
