"use strict";

const npa = require("npm-package-arg");
const semver = require("semver");
const log = require("npmlog");

const ValidationError = require("@lerna/validation-error");
const prereleaseIdFromVersion = require("@lerna/prerelease-id-from-version");

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
      prereleaseId: {
        // an existing prerelease ID only matters at the beginning
        value: prereleaseIdFromVersion(pkg.version),
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

    if (packages.length !== this.size) {
      // weed out the duplicates
      const seen = new Map();

      for (const { name, location } of packages) {
        if (seen.has(name)) {
          seen.get(name).push(location);
        } else {
          seen.set(name, [location]);
        }
      }

      for (const [name, locations] of seen) {
        if (locations.length > 1) {
          throw new ValidationError(
            "ENAME",
            [`Package name "${name}" used in multiple packages:`, ...locations].join("\n\t")
          );
        }
      }
    }

    this.forEach((currentNode, currentName) => {
      const graphDependencies =
        graphType === "dependencies"
          ? Object.assign({}, currentNode.pkg.optionalDependencies, currentNode.pkg.dependencies)
          : Object.assign(
              {},
              currentNode.pkg.devDependencies,
              currentNode.pkg.optionalDependencies,
              currentNode.pkg.dependencies
            );

      Object.keys(graphDependencies).forEach(depName => {
        const depNode = this.get(depName);
        // Yarn decided to ignore https://github.com/npm/npm/pull/15900 and implemented "link:"
        // As they apparently have no intention of being compatible, we have to do it for them.
        // @see https://github.com/yarnpkg/yarn/issues/4212
        const spec = graphDependencies[depName].replace(/^link:/, "file:");
        const resolved = npa.resolve(depName, spec, currentNode.location);

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

  get rawPackageList() {
    return Array.from(this.values()).map(node => node.pkg);
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
    return this.extendList(filteredPackages, "localDependencies");
  }

  /**
   * Takes a list of Packages and returns a list of those same Packages with any Packages
   * that depend on them. i.e if packageC depended on packageD `graph.addDependents([packageD])`
   * would return [packageD, packageC].
   *
   * @param {!Array.<Package>} filteredPackages The packages to include dependents for.
   * @return {Array.<Package>} The packages with any dependents that weren't already included.
   */
  addDependents(filteredPackages) {
    return this.extendList(filteredPackages, "localDependents");
  }

  /**
   * Extends a list of packages by traversing on a given property, which must refer to a
   * `PackageGraphNode` property that is a collection of `PackageGraphNode`s
   *
   * @param {!Array.<Package>} packageList The list of packages to extend
   * @param {!String} nodeProp The property on `PackageGraphNode` used to traverse
   * @return {Array.<Package>} The packages with any additional packages found by traversing
   *                           nodeProp
   */
  extendList(packageList, nodeProp) {
    // the current list of packages we are expanding using breadth-first-search
    const search = new Set(packageList.map(({ name }) => this.get(name)));

    // an intermediate list of matched PackageGraphNodes
    const result = [];

    search.forEach(currentNode => {
      // anything searched for is always a result
      result.push(currentNode);

      currentNode[nodeProp].forEach((meta, depName) => {
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
   * @param {!boolean} rejectCycles Whether or not to reject cycles
   * @returns [Set<String[]>, Set<PackageGraphNode>]
   */
  partitionCycles(rejectCycles) {
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
          const cycleDependentName = Array.from(dependentNode.localDependencies.keys()).find(key =>
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

    if (cyclePaths.size) {
      const cycleMessage = ["Dependency cycles detected, you should fix these!"]
        .concat(Array.from(cyclePaths).map(cycle => cycle.join(" -> ")))
        .join("\n");

      if (rejectCycles) {
        throw new ValidationError("ECYCLE", cycleMessage);
      }

      log.warn("ECYCLE", cycleMessage);
    }

    return [cyclePaths, cycleNodes];
  }

  /**
   * Remove cycle nodes.
   * @param {Set<PackageGraphNode>} cycleNodes
   */
  pruneCycleNodes(cycleNodes) {
    return this.prune(...cycleNodes);
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
