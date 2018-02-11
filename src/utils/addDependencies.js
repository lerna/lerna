"use strict";

module.exports = addDependencies;

/**
 * Takes a list of Packages and returns a list of those same Packages with any Packages
 * they depend on. i.e if packageA depended on packageB
 * `addDependencies([packageA], this.packageGraph)` would return [packageA, packageB].
 *
 * @param {!Array.<Package>} packages The packages to include dependencies for.
 * @param {!<PackageGraph>} packageGraph The package graph for the whole repository.
 * @return {Array.<Package>} The packages with any dependencies that were't already included.
 */
function addDependencies(packages, packageGraph) {
  // the current list of packages we are expanding using breadth-first-search
  const search = new Set(packages.map(({ name }) => name).map(name => packageGraph.get(name)));

  // an intermediate list of matched PackageGraphNodes
  const result = [];

  search.forEach(currentNode => {
    // anything searched for is always a result
    result.push(currentNode);

    currentNode.localDependencies.forEach((meta, depName) => {
      const depNode = packageGraph.get(depName);

      if (depNode !== currentNode && !search.has(depNode)) {
        search.add(depNode);
      }
    });
  });

  // actual Package instances, not PackageGraphNodes
  return result.map(node => node.pkg);
}
