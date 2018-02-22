"use strict";

const Command = require("../Command");
const PackageGraph = require("../PackageGraph");
const symlinkDependencies = require("../utils/symlink-dependencies");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new LinkCommand(argv);
};

exports.command = "link";

exports.describe = "Symlink together all packages which are dependencies of each other";

exports.builder = {
  "force-local": {
    group: "Command Options:",
    describe: "Force local",
    type: "boolean",
    default: undefined,
  },
};

class LinkCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      forceLocal: false,
    });
  }

  initialize(callback) {
    callback(null, true);
  }

  execute(callback) {
    let graph = this.packageGraph;

    if (this.options.forceLocal) {
      graph = new PackageGraph(this.packages, "allDependencies", "forceLocal");
    }

    symlinkDependencies(this.packages, graph, this.logger, callback);
  }
}
