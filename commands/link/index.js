"use strict";

const path = require("path");
const pMap = require("p-map");
const slash = require("slash");
const Command = require("@lerna/command");
const PackageGraph = require("@lerna/package-graph");
const symlinkDependencies = require("@lerna/symlink-dependencies");

module.exports = factory;

function factory(argv) {
  return new LinkCommand(argv);
}

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
    if (this.options._.pop() === "convert") {
      return this.convertLinksToFileSpecs();
    }

    return symlinkDependencies(this.packages, this.targetGraph, this.logger);
  }

  convertLinksToFileSpecs() {
    const rootPkg = this.project.manifest;
    const rootDependencies = {};
    const hoisted = {};
    const changed = new Set();
    const savePrefix = "file:";

    for (const targetNode of this.targetGraph.values()) {
      const resolved = { name: targetNode.name, type: "directory" };

      // install root file: specifiers to avoid bootstrap
      rootDependencies[targetNode.name] = targetNode.pkg.resolved.saveSpec;

      for (const depNode of targetNode.localDependents.values()) {
        const depVersion = slash(path.relative(depNode.pkg.location, targetNode.pkg.location));
        // console.log("\n%s\n  %j: %j", depNode.name, name, `${savePrefix}${depVersion}`);

        depNode.pkg.updateLocalDependency(resolved, depVersion, savePrefix);
        changed.add(depNode);
      }

      if (targetNode.pkg.devDependencies) {
        // hoist _all_ devDependencies to the root
        Object.assign(hoisted, targetNode.pkg.devDependencies);
        targetNode.pkg.set("devDependencies", {});
        changed.add(targetNode);
      }
    }

    // mutate project manifest, completely overwriting existing dependencies
    rootPkg.set("dependencies", rootDependencies);
    rootPkg.set("devDependencies", Object.assign(rootPkg.get("devDependencies") || {}, hoisted));

    return pMap(changed, node => node.pkg.serialize()).then(() => rootPkg.serialize());
  }
}

module.exports.LinkCommand = LinkCommand;
