"use strict";

const npa = require("npm-package-arg");
const semver = require("semver");

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!<Package>} pkg - A Package object to build the node from.
 * @param {!<String>} graphType - "allDependencies" or "dependencies"
 */
class PackageGraphNode {
  constructor(pkg, graphType) {
    Object.defineProperties(this, {
      // immutable properties
      name: {
        enumerable: true,
        value: pkg.name,
      },
      location: {
        value: pkg.location,
      },
      // properties that might change over time
      version: {
        get() {
          return pkg.version;
        },
      },
      graphDependencies: {
        get() {
          return pkg[graphType] || {};
        },
      },
      pkg: {
        get() {
          return pkg;
        },
      },
      // graph-specific computed properties
      indegree: {
        get() {
          // https://en.wikipedia.org/wiki/Directed_graph#Indegree_and_outdegree
          return this.localDependencies.size;
        },
      },
      outdegree: {
        get() {
          // https://en.wikipedia.org/wiki/Directed_graph#Indegree_and_outdegree
          return this.localDependents.size;
        },
      },
      degree: {
        get() {
          // https://en.wikipedia.org/wiki/Degree_(graph_theory)
          return this.indegree + this.outdegree;
        },
      },
    });

    this.externalDependencies = new Map();
    this.localDependencies = new Map();
    this.localDependents = new Map();
  }

  is(degreeType) {
    // The mind-bending thing (just one?!) about dependency graphs
    // is that the arrows ("edges") point in the reverse direction
    // of the traditional implication of "has a dependency on" and
    // "is a dependent of" relationship descriptions.
    switch (degreeType) {
      case "source":
        // only local dependents
        return this.indegree === 0;

      case "sink":
        // only local dependencies
        return this.outdegree === 0;

      case "isolated":
        // no local dependencies or dependents
        return this.degree === 0;

      case "leaf":
        // exactly one local dependency OR dependent
        return this.degree === 1;

      case "internal":
        // more than one local dependency OR dependents
        return !(this.indegree === 0 || this.outdegree === 0);

      default:
        throw new Error(`unknown property "${degreeType}"`);
    }
  }
}

/**
 * A PackageGraph.
 * @constructor
 * @param {!Array.<Package>} packages An array of Packages to build the graph out of.
 * @param {!Object} config
 * @param {!String} config.graphType ("allDependencies" or "dependencies")
 *    Pass "dependencies" to create a graph of only dependencies,
 *    excluding the devDependencies that would normally be included.
 * @param {Boolean} config.forceLocal Force all local dependencies to be linked.
 */
class PackageGraph extends Map {
  constructor(packages, { graphType, forceLocal }) {
    super(packages.map(pkg => [pkg.name, new PackageGraphNode(pkg, graphType)]));

    const satisfies = forceLocal
      ? () => true
      : (version, resolved) => semver.satisfies(version, resolved.fetchSpec || resolved.gitCommittish);

    this.forEach((currentNode, currentName) => {
      const { graphDependencies } = currentNode;

      Object.keys(graphDependencies).forEach(depName => {
        const depNode = this.get(depName);
        const resolved = npa.resolve(depName, graphDependencies[depName], currentNode.location);

        if (!depNode) {
          // it's an external dependency, store the resolution and bail
          return currentNode.externalDependencies.set(depName, resolved);
        }

        if (satisfies(depNode.version, resolved)) {
          currentNode.localDependencies.set(depName, resolved);
          depNode.localDependents.set(currentName, currentNode);
        }
      });
    });
  }

  /**
   * Return a tuple of cycle paths and nodes, which have been removed from the graph.
   * @returns [Set<String[]>, Set<PackageGraphNode>]
   */
  partitionCycles() {
    const cyclePaths = new Set();
    const cycleNodes = new Set();

    this.forEach((currentNode, currentName) => {
      // console.error("START %s\n%O", currentName, currentNode);
      const seen = new Set();

      if (currentNode.localDependencies.has(currentName)) {
        // utterly ridiculous self -> self
        seen.add(currentNode);
        cyclePaths.add([currentName, currentName]);
      }

      const visits = walk => (dependentNode, dependentName, siblingDependents) => {
        const step = walk.concat(dependentName);
        // console.warn("VISITS %O", step);

        if (seen.has(dependentNode)) {
          // console.info("SEEN:: %O", [currentName, dependentName]);
          return;
        }

        seen.add(dependentNode);

        if (dependentNode === currentNode) {
          // a direct cycle
          cycleNodes.add(currentNode);
          cyclePaths.add(step);
          // console.error("DIRECT", step);

          return;
        }

        if (siblingDependents.has(currentName)) {
          // a transitive cycle
          const cycleDependentName = Array.from(dependentNode.localDependencies).find(([key]) =>
            currentNode.localDependents.has(key)
          );
          const pathToCycle = step
            .slice()
            .reverse()
            .concat(cycleDependentName);

          // console.error("TRANSITIVE", pathToCycle);
          cycleNodes.add(dependentNode);
          cyclePaths.add(pathToCycle);
        }

        dependentNode.localDependents.forEach(visits(step));
        // console.warn("EXITED %O", step);
      };

      // currentNode.localDependents.forEach((topLevelNode, topLevelName, sibs) => {
      //   console.log("TOPLVL %O\n%O", [currentName, topLevelName], topLevelNode);
      //   visits([currentName])(topLevelNode, topLevelName, sibs);
      // });
      currentNode.localDependents.forEach(visits([currentName]));
    });

    if (cycleNodes.size) {
      this.prune(...cycleNodes);
    }

    return [cyclePaths, cycleNodes];
  }

  /**
   * Remove all candidate nodes.
   * @param {PackageGraphNode[]} candidates
   */
  prune(...candidates) {
    if (candidates.length === this.size) {
      return this.clear();
    }

    candidates.forEach(node => this.remove(node));
  }

  /**
   * Delete by value (instead of key), as well as removing pointers
   * to itself in the other node's internal collections.
   * @param {PackageGraphNode} candidateNode instance to remove
   */
  remove(candidateNode) {
    this.delete(candidateNode.name);

    this.forEach(node => {
      // remove incoming edges ("indegree")
      node.localDependencies.delete(candidateNode.name);

      // remove outgoing edges ("outdegree")
      node.localDependents.delete(candidateNode.name);
    });
  }
}

module.exports = PackageGraph;
