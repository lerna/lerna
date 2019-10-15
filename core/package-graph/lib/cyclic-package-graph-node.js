"use strict";

let lastCollapsedNodeId = 0;

/**
 * Represents a cyclic collection of nodes in a PackageGraph.
 * It is meant to be used as a black box, where the only exposed
 * information are the connections to the other nodes of the graph.
 * It can contains either `PackageGraphNode`s or other `CyclicPackageGraphNode`s.
 */
class CyclicPackageGraphNode extends Map {
  constructor() {
    super();

    this.localDependencies = new Map();
    this.localDependents = new Map();

    Object.defineProperties(this, {
      // immutable properties
      name: {
        enumerable: true,
        value: `(cycle) ${(lastCollapsedNodeId += 1)}`,
      },
      isCycle: {
        value: true,
      },
    });
  }

  /**
   * @returns {String} Returns a representation of a cycle, like like `A -> B -> C -> A`.
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
   *
   * @returns {PackageGraphNode[]}
   */
  flatten() {
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
   * @param {String} name The name of the package to search in this cycle
   * @returns {Boolean}
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
   * @param {PackageGraphNode|CyclicPackageGraphNode} node
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
   * @param {PackageGraphNode|CyclicPackageGraphNode} candidateNode instance to unlink
   */
  unlink(candidateNode) {
    // remove incoming edges ("indegree")
    this.localDependencies.delete(candidateNode.name);

    // remove outgoing edges ("outdegree")
    this.localDependents.delete(candidateNode.name);
  }
}

module.exports.CyclicPackageGraphNode = CyclicPackageGraphNode;
