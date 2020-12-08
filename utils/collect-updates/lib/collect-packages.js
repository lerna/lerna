"use strict";

const { collectDependents } = require("./collect-dependents");

module.exports.collectPackages = collectPackages;

/** @typedef {import("@lerna/package-graph/lib/package-graph-node").PackageGraphNode} PackageGraphNode */

/**
 * @typedef {object} CollectorOptions
 * @property {(node: PackageGraphNode, name: string) => boolean} [isCandidate] By default, all nodes passed in are candidates
 * @property {(name: string) => void} [onInclude]
 * @property {boolean} [excludeDependents]
 */

/**
 * Build a list of graph nodes, possibly including dependents, using predicate if available.
 * @param {Map<string, PackageGraphNode>} packages
 * @param {CollectorOptions} options
 */
function collectPackages(packages, { isCandidate = () => true, onInclude, excludeDependents } = {}) {
  /** @type {Set<PackageGraphNode>} */
  const candidates = new Set();

  packages.forEach((node, name) => {
    if (isCandidate(node, name)) {
      candidates.add(node);
    }
  });

  if (!excludeDependents) {
    collectDependents(candidates).forEach((node) => candidates.add(node));
  }

  // The result should always be in the same order as the input
  /** @type {PackageGraphNode[]} */
  const updates = [];

  packages.forEach((node, name) => {
    if (candidates.has(node)) {
      if (onInclude) {
        onInclude(name);
      }
      updates.push(node);
    }
  });

  return updates;
}
