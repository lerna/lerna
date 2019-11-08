"use strict";

const npmlog = require("npmlog");
const figgyPudding = require("figgy-pudding");
const collectUpdates = require("@lerna/collect-updates");
const filterPackages = require("@lerna/filter-packages");

module.exports = getFilteredPackages;

const FilterConfig = figgyPudding({
  scope: {},
  ignore: {},
  private: {},
  since: {},
  continueIfNoMatch: {},
  excludeDependents: {},
  includeDependents: {},
  includeDependencies: {},
  includeFilteredDependents: "includeDependents",
  includeFilteredDependencies: "includeDependencies",
  includeMergedTags: {},
  log: { default: npmlog },
});

function getFilteredPackages(packageGraph, execOpts, opts) {
  const options = FilterConfig(opts);

  if (options.scope) {
    options.log.notice("filter", "including %j", options.scope);
  }

  if (options.ignore) {
    options.log.notice("filter", "excluding %j", options.ignore);
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
    options.log.notice("filter", "changed since %j", options.since);

    if (options.excludeDependents) {
      options.log.notice("filter", "excluding dependents");
    }

    if (options.includeMergedTags) {
      options.log.notice("filter", "including merged tags");
    }

    chain = chain.then(filteredPackages =>
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, opts)).then(updates => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        return filteredPackages.filter(pkg => updated.has(pkg.name));
      })
    );
  }

  if (options.includeDependents) {
    options.log.notice("filter", "including dependents");

    chain = chain.then(filteredPackages => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeDependencies) {
    options.log.notice("filter", "including dependencies");

    chain = chain.then(filteredPackages => packageGraph.addDependencies(filteredPackages));
  }

  return chain;
}
