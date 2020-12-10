"use strict";

const log = require("npmlog");
const { collectUpdates } = require("@lerna/collect-updates");
const { filterPackages } = require("@lerna/filter-packages");

module.exports.getFilteredPackages = getFilteredPackages;

/**
 * @typedef {object} FilterOptions
 * @property {string} scope
 * @property {string} ignore
 * @property {boolean} private
 * @property {string} since
 * @property {boolean} continueIfNoMatch
 * @property {boolean} excludeDependents
 * @property {boolean} includeDependents
 * @property {boolean} includeDependencies
 * @property {boolean} includeMergedTags
 * @property {typeof log} log
 */

/**
 * Retrieve a list of Package instances filtered by various options.
 * @param {import("@lerna/package-graph").PackageGraph} packageGraph
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 * @param {Partial<FilterOptions>} opts
 * @returns {Promise<import("@lerna/package").Package[]>}
 */
function getFilteredPackages(packageGraph, execOpts, opts) {
  const options = { log, ...opts };

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

    chain = chain.then((/** @type {ReturnType<typeof filterPackages>} */ filteredPackages) =>
      Promise.resolve(collectUpdates(filteredPackages, packageGraph, execOpts, opts)).then((updates) => {
        const updated = new Set(updates.map(({ pkg }) => pkg.name));

        return filteredPackages.filter((pkg) => updated.has(pkg.name));
      })
    );
  }

  if (options.includeDependents) {
    options.log.notice("filter", "including dependents");

    chain = chain.then((filteredPackages) => packageGraph.addDependents(filteredPackages));
  }

  if (options.includeDependencies) {
    options.log.notice("filter", "including dependencies");

    chain = chain.then((filteredPackages) => packageGraph.addDependencies(filteredPackages));
  }

  return chain;
}
