"use strict";

const figgyPudding = require("figgy-pudding");
const PackageGraph = require("@lerna/package-graph");

const QueryGraphConfig = figgyPudding({
  "graph-type": {},
  graphType: "graph-type",
  "reject-cycles": {},
  rejectCycles: "reject-cycles",
});

class QueryGraph {
  /**
   * A mutable PackageGraph used to query for next available packages.
   *
   * @param {Array<Package>} packages An array of Packages to build the graph out of
   * @param {String} [opts.graphType="allDependencies"] "dependencies" excludes devDependencies from graph
   * @param {Boolean} [opts.rejectCycles] Whether or not to reject cycles
   * @constructor
   */
  constructor(packages, opts) {
    const options = QueryGraphConfig(opts);

    // Create dependency graph
    this.graph = new PackageGraph(packages, options.graphType);

    // Evaluate cycles
    this.cycles = this.graph.collapseCycles(options.rejectCycles);
  }

  _getNextLeaf() {
    return Array.from(this.graph.values()).filter(node => node.localDependencies.size === 0);
  }

  _getNextCycle() {
    const cycle = Array.from(this.cycles).find(cycleNode => cycleNode.localDependencies.size === 0);

    if (!cycle) {
      return [];
    }

    this.cycles.delete(cycle);

    return cycle.flatten();
  }

  getAvailablePackages() {
    // Get the next leaf nodes
    const availablePackages = this._getNextLeaf();

    if (availablePackages.length > 0) {
      return availablePackages;
    }

    return this._getNextCycle();
  }

  markAsTaken(name) {
    this.graph.delete(name);
  }

  markAsDone(candidateNode) {
    this.graph.remove(candidateNode);

    for (const cycle of this.cycles) {
      cycle.unlink(candidateNode);
    }
  }
}

module.exports = QueryGraph;
module.exports.toposort = toposort;

/**
 * Sort the input list topologically.
 *
 * @param {!Array.<Package>} packages An array of Packages to build the list out of
 * @param {Object} [options]
 * @param {Boolean} options.graphType "allDependencies" or "dependencies", which excludes devDependencies
 * @param {Boolean} options.rejectCycles Whether or not to reject cycles
 *
 * @returns {Array<Package>} a list of Package instances in topological order
 */
function toposort(packages, opts) {
  const graph = new QueryGraph(packages, opts);
  const result = [];

  let batch = graph.getAvailablePackages();

  while (batch.length) {
    for (const node of batch) {
      // no need to take() in synchronous loop
      result.push(node.pkg);
      graph.markAsDone(node);
    }

    batch = graph.getAvailablePackages();
  }

  return result;
}
