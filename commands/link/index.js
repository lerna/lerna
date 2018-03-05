"use strict";

const Command = require("@lerna/command");
const PackageGraph = require("@lerna/package-graph");
const symlinkDependencies = require("@lerna/symlink-dependencies");

class LinkCommand extends Command {
  get requiresGit() {
    return false;
  }

  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      forceLocal: false,
    });
  }

  initialize() {
    let graph = this.packageGraph;

    if (this.options.forceLocal) {
      graph = new PackageGraph(this.packages, "allDependencies", "forceLocal");
    }

    this.targetGraph = graph;
  }

  execute() {
    return symlinkDependencies(this.packages, this.targetGraph, this.logger);
  }
}

module.exports = LinkCommand;
