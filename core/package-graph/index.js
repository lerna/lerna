"use strict";

const npa = require("npm-package-arg");
const semver = require("semver");

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!<Package>} pkg - A Package object to build the node from.
 */
class PackageGraphNode {
  constructor(pkg) {
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
      pkg: {
        get() {
          return pkg;
        },
      },
    });

    this.externalDependencies = new Map();
    this.localDependencies = new Map();
    this.localDependents = new Map();
  }

  /**
   * Determine if the Node satisfies a resolved semver range.
   * @see https://github.com/npm/npm-package-arg#result-object
   *
   * @param {!Result} resolved npm-package-arg Result object
   * @returns {Boolean}
   */
  satisfies({ gitCommittish, gitRange, fetchSpec }) {
    return semver.satisfies(this.version, gitCommittish || gitRange || fetchSpec);
  }
}

/**
 * A PackageGraph.
 * @constructor
 * @param {!Array.<Package>} packages An array of Packages to build the graph out of.
 * @param {String} graphType ("allDependencies" or "dependencies")
 *    Pass "dependencies" to create a graph of only dependencies,
 *    excluding the devDependencies that would normally be included.
 * @param {Boolean} forceLocal Force all local dependencies to be linked.
 */
class PackageGraph extends Map {
  constructor(packages, graphType = "allDependencies", forceLocal) {
    super(packages.map(pkg => [pkg.name, new PackageGraphNode(pkg)]));

    this.forEach((currentNode, currentName) => {
      const graphDependencies =
        graphType === "dependencies"
          ? Object.assign({}, currentNode.pkg.dependencies)
          : Object.assign({}, currentNode.pkg.devDependencies, currentNode.pkg.dependencies);

      Object.keys(graphDependencies).forEach(depName => {
        const depNode = this.get(depName);
        const resolved = npa.resolve(depName, graphDependencies[depName], currentNode.location);

        if (!depNode) {
          // it's an external dependency, store the resolution and bail
          return currentNode.externalDependencies.set(depName, resolved);
        }

        if (forceLocal || resolved.fetchSpec === depNode.location || depNode.satisfies(resolved)) {
          // a local file: specifier OR a matching semver
          currentNode.localDependencies.set(depName, resolved);
          depNode.localDependents.set(currentName, currentNode);
        } else {
          // non-matching semver of a local dependency
          currentNode.externalDependencies.set(depName, resolved);
        }
      });
    });
  }

  /**
   * Takes a list of Packages and returns a list of those same Packages with any Packages
   * they depend on. i.e if packageA depended on packageB `graph.addDependencies([packageA])`
   * would return [packageA, packageB].
   *
   * @param {!Array.<Package>} filteredPackages The packages to include dependencies for.
   * @return {Array.<Package>} The packages with any dependencies that weren't already included.
   */
  addDependencies(filteredPackages) {
    // the current list of packages we are expanding using breadth-first-search
    const search = new Set(filteredPackages.map(({ name }) => this.get(name)));

    // an intermediate list of matched PackageGraphNodes
    const result = [];

    search.forEach(currentNode => {
      // anything searched for is always a result
      result.push(currentNode);

      currentNode.localDependencies.forEach((meta, depName) => {
        const depNode = this.get(depName);

        if (depNode !== currentNode && !search.has(depNode)) {
          search.add(depNode);
        }
      });
    });

    // actual Package instances, not PackageGraphNodes
    return result.map(node => node.pkg);
  }

  /**
   * Return a tuple of cycle paths and nodes, which have been removed from the graph.
   * @returns [Set<String[]>, Set<PackageGraphNode>]
   */
  partitionCycles() {
    const cyclePaths = new Set();
    const cycleNodes = new Set();

    this.forEach((currentNode, currentName) => {
      const seen = new Set();

      const visits = walk => (dependentNode, dependentName, siblingDependents) => {
        const step = walk.concat(dependentName);

        if (seen.has(dependentNode)) {
          return;
        }

        seen.add(dependentNode);

        if (dependentNode === currentNode) {
          // a direct cycle
          cycleNodes.add(currentNode);
          cyclePaths.add(step);

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

          cycleNodes.add(dependentNode);
          cyclePaths.add(pathToCycle);
        }

        dependentNode.localDependents.forEach(visits(step));
      };

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
