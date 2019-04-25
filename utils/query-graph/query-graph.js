"use strict";

const log = require("npmlog");

const PackageGraph = require("@lerna/package-graph");
const ValidationError = require("@lerna/validation-error");

/**
 * A mutable PackageGraph used to query for next available packages
 * @constructor
 * @param {!Array.<Package>} packages An array of Packages to build the graph out of
 * @param {!boolean} rejectCycles Whether or not to reject cycles
 */

class QueryGraph {
  constructor(packages, rejectCycles) {
    // Create dependency graph
    this.graph = new PackageGraph(packages);

    // Evaluate cycles
    [this.cyclePaths, this.cycleNodes] = this.graph.partitionCycles(rejectCycles);

    if (this.cyclePaths.size) {
      // Find the cyclical package with the most dependents. Will be evaluated before other cyclical packages
      this.cyclicalPackageWithMostDependents = Array.from(this.cycleNodes)
        .sort((a, b) => b.localDependents.size - a.localDependents.size)
        .shift();
    }
  }

  _getNextLeaf() {
    return Array.from(this.graph.values()).filter(node => node.localDependencies.size === 0);
  }

  _getNextCycle() {
    // If the cyclical package with the most dependents is still in the graph, we return it
    if (this.graph.has(this.cyclicalPackageWithMostDependents.name)) {
      return [this.graph.get(this.cyclicalPackageWithMostDependents.name)];
    }

    // Otherwise, return any package that does not depend on the pacakge referenced above
    return Array.from(this.graph.values()).filter(
      node => !node.localDependencies.has(this.cyclicalPackageWithMostDependents)
    );
  }

  _onlyCyclesLeft() {
    // Check if every remaining package is a pacakge from the cycleNodes graph
    return Array.from(this.graph.values()).every(node =>
      Array.from(this.cycleNodes).some(cycleNode => cycleNode.name === node.name)
    );
  }

  getAvailablePackages() {
    // Get the next leaf nodes
    const availablePackages = this._getNextLeaf();

    if (availablePackages.length > 0) {
      return availablePackages;
    }

    // Or, get the next cylical packages
    if (this.cyclePaths.size && this._onlyCyclesLeft()) {
      return this._getNextCycle();
    }

    return [];
  }

  markAsTaken(name) {
    this.graph.delete(name);
  }

  markAsDone(candidateNode) {
    this.graph.remove(candidateNode);
  }
}

module.exports = QueryGraph;
