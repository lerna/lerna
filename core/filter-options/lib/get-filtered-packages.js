"use strict";

const npmlog = require("npmlog");
const figgyPudding = require("figgy-pudding");
const path = require("path");
const collectUpdates = require("@lerna/collect-updates");
const filterPackages = require("@lerna/filter-packages");

module.exports = getFilteredPackages;

const FilterConfig = figgyPudding({
  scope: {},
  currentScope: {},
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

  let scope;

  if (options.scope) {
    scope = options.scope;
  }

  if (options.currentScope) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const { name } = require(path.join(process.cwd(), "package.json"));
    scope = name;
  }

  if (scope) {
    options.log.notice("filter", "including %j", scope);
  }

  if (options.ignore) {
    options.log.notice("filter", "excluding %j", options.ignore);
  }

  let chain = Promise.resolve();

  chain = chain.then(() =>
    filterPackages(
      packageGraph.rawPackageList,
      scope,
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
