"use strict";

const collectUpdates = require("@lerna/collect-updates");
const filterPackages = require("@lerna/filter-packages");

module.exports = getFilteredPackages;

function getFilteredPackages(packageGraph, execOpts, options) {
  let chain = Promise.resolve();

  chain = chain.then(() =>
    filterPackages(packageGraph.rawPackageList, options.scope, options.ignore, options.private)
  );

  if (options.since !== undefined) {
    chain = chain.then(filteredPackages =>
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, options)).then(updates => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        return filteredPackages.filter(pkg => updated.has(pkg.name));
      })
    );
  }

  if (options.includeFilteredDependents) {
    chain = chain.then(filteredPackages => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeFilteredDependencies) {
    chain = chain.then(filteredPackages => packageGraph.addDependencies(filteredPackages));
  }

  return chain;
}
