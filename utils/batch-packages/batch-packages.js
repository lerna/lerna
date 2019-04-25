"use strict";

const log = require("npmlog");
const PackageGraph = require("@lerna/package-graph");

module.exports = batchPackages;

function batchPackages(packagesToBatch, rejectCycles, graphType) {
  // create a new graph because we will be mutating it
  const graph = new PackageGraph(packagesToBatch, graphType);
  const [cyclePaths, cycleNodes] = graph.partitionCycles(rejectCycles);
  const batches = [];

  if (cyclePaths.size) {
    graph.pruneCycleNodes(cycleNodes);
  }

  while (graph.size) {
    // pick the current set of nodes _without_ localDependencies (aka it is a "source" node)
    const batch = Array.from(graph.values()).filter(node => node.localDependencies.size === 0);

    log.silly("batched", batch);
    // batches are composed of Package instances, not PackageGraphNodes
    batches.push(batch.map(node => node.pkg));

    // pruning the graph changes the node.localDependencies.size test
    graph.prune(...batch);
  }

  if (cycleNodes.size) {
    // isolate cycles behind a single-package batch of the cyclical package with the most dependents
    const [king, ...rats] = Array.from(cycleNodes)
      .sort((a, b) => b.localDependents.size - a.localDependents.size)
      .map(node => node.pkg);

    batches.push([king]);
    batches.push(rats);
  }

  return batches;
}
