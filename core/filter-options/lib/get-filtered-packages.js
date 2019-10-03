"use strict";

const log = require("npmlog");
const collectUpdates = require("@lerna/collect-updates");
const filterPackages = require("@lerna/filter-packages");

module.exports = getFilteredPackages;

function getFilteredPackages(packageGraph, execOpts, options) {
  if (options.scope) {
    log.notice("filter", "including %j", options.scope);
  }

  if (options.ignore) {
    log.notice("filter", "excluding %j", options.ignore);
  }

  let chain = Promise.resolve();

  chain = chain.then(() =>
    filterPackages(
      packageGraph.rawPackageList,
      options.scope,
      options.ignore,
      options.private,
      options.continueIfNoMatch
    )
  );

  if (options.since !== undefined) {
    log.notice("filter", "changed since %j", options.since);

    chain = chain.then(filteredPackages =>
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, options)).then(updates => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        return filteredPackages.filter(pkg => updated.has(pkg.name));
      })
    );
  }

  if (options.includeFilteredDependents) {
    log.notice("filter", "including filtered dependents");

    chain = chain.then(filteredPackages => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeFilteredDependencies) {
    log.notice("filter", "including filtered dependencies");

    chain = chain.then(filteredPackages => packageGraph.addDependencies(filteredPackages));
  }

  return chain;
}
