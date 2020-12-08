"use strict";

module.exports.collectDependents = collectDependents;

/** @typedef {import("@lerna/package-graph/lib/package-graph-node").PackageGraphNode} PackageGraphNode */

/**
 * @callback LocalDependentVisitor
 * @param {PackageGraphNode} dependentNode
 * @param {string} dependentName
 * @param {Map<string, PackageGraphNode>} siblingDependents
 */

/**
 * Build a set of nodes that are dependents of the input set.
 * @param {Set<PackageGraphNode>} nodes
 */
function collectDependents(nodes) {
  /** @type {Set<PackageGraphNode>} */
  const collected = new Set();

  nodes.forEach((currentNode) => {
    if (currentNode.localDependents.size === 0) {
      // no point diving into a non-existent tree
      return;
    }

    // breadth-first search
    const queue = [currentNode];
    const seen = new Set();

    /** @type {LocalDependentVisitor} */
    const visit = (dependentNode, dependentName, siblingDependents) => {
      if (seen.has(dependentNode)) {
        return;
      }

      seen.add(dependentNode);

      if (dependentNode === currentNode || siblingDependents.has(currentNode.name)) {
        // a direct or transitive cycle, skip it
        return;
      }

      collected.add(dependentNode);
      queue.push(dependentNode);
    };

    while (queue.length) {
      const node = queue.shift();

      node.localDependents.forEach(visit);
    }
  });

  return collected;
}
