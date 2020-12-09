"use strict";

let lastCollapsedNodeId = 0;

/**
 * Represents a cyclic collection of nodes in a PackageGraph.
 * It is meant to be used as a black box, where the only exposed
 * information are the connections to the other nodes of the graph.
 * It can contain either `PackageGraphNode`s or other `CyclicPackageGraphNode`s.
 *
 * @extends {Map<string, import('..').PackageGraphNode | CyclicPackageGraphNode>}
 */
class CyclicPackageGraphNode extends Map {
  constructor() {
    super();

    this.name = `(cycle) ${(lastCollapsedNodeId += 1)}`;

    /** @type {Map<string, import('..').PackageGraphNode | CyclicPackageGraphNode>} */
    this.localDependencies = new Map();

    /** @type {Map<string, import('..').PackageGraphNode | CyclicPackageGraphNode>} */
    this.localDependents = new Map();
  }

  // eslint-disable-next-line class-methods-use-this
  get isCycle() {
    return true;
  }

  /**
   * @returns {string} A representation of a cycle, like like `A -> B -> C -> A`.
   */
  toString() {
    const parts = Array.from(this, ([key, node]) =>
      node.isCycle ? `(nested cycle: ${node.toString()})` : key
    );

    // start from the origin
    parts.push(parts[0]);

    return parts.reverse().join(" -> ");
  }

  /**
   * Flattens a CyclicPackageGraphNode (which can have multiple level of cycles).
   */
  flatten() {
    /** @type {import('..').PackageGraphNode[]} */
    const result = [];

    for (const node of this.values()) {
      if (node.isCycle) {
        result.push(...node.flatten());
      } else {
        result.push(node);
      }
    }

    return result;
  }

  /**
   * Checks if a given node is contained in this cycle (or in a nested one)
   *
   * @param {string} name The name of the package to search in this cycle
   * @returns {boolean}
   */
  contains(name) {
    for (const [currentName, currentNode] of this) {
      if (currentNode.isCycle) {
        if (currentNode.contains(name)) {
          return true;
        }
      } else if (currentName === name) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adds a graph node, or a nested cycle, to this group.
   *
   * @param {import('..').PackageGraphNode | CyclicPackageGraphNode} node
   */
  insert(node) {
    this.set(node.name, node);
    this.unlink(node);

    for (const [dependencyName, dependencyNode] of node.localDependencies) {
      if (!this.contains(dependencyName)) {
        this.localDependencies.set(dependencyName, dependencyNode);
      }
    }

    for (const [dependentName, dependentNode] of node.localDependents) {
      if (!this.contains(dependentName)) {
        this.localDependents.set(dependentName, dependentNode);
      }
    }
  }

  /**
   * Remove pointers to candidate node from internal collections.
   * @param {import('..').PackageGraphNode | CyclicPackageGraphNode} candidateNode instance to unlink
   */
  unlink(candidateNode) {
    // remove incoming edges ("indegree")
    this.localDependencies.delete(candidateNode.name);

    // remove outgoing edges ("outdegree")
    this.localDependents.delete(candidateNode.name);
  }
}

module.exports.CyclicPackageGraphNode = CyclicPackageGraphNode;
