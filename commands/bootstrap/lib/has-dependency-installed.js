"use strict";

const log = require("npmlog");
const Arborist = require("@npmcli/arborist");
const semver = require("semver");

/** @typedef {Map<string, string>} InstalledDependencies dependency name -> installed version */

// cache installed lookups
/** @type {Map<import("@lerna/package").Package, InstalledDependencies>} */
const cache = new Map();

module.exports.hasDependencyInstalled = hasDependencyInstalled;

/**
 * Determine if a dependency has already been installed for this package
 * @param {import("@lerna/package").Package} pkg The Package instance to check for installed dependency
 * @param {string} depName Name of the dependency
 * @param {string} needVersion version to test with
 */
function hasDependencyInstalled(pkg, depName, needVersion) {
  log.silly("hasDependencyInstalled", pkg.name, depName);

  return getInstalled(pkg).then(
    (versions) => versions.has(depName) && semver.satisfies(versions.get(depName), needVersion)
  );
}

/**
 * @param {import("@lerna/package").Package} pkg
 * @returns {Promise<InstalledDependencies>}
 */
function getInstalled(pkg) {
  if (cache.has(pkg)) {
    return Promise.resolve(cache.get(pkg));
  }
  const arb = new Arborist({
    path: pkg.location,
  });
  return arb.loadActual().then((tree) => {
    /** @type {InstalledDependencies} */
    const deps = new Map();

    for (const [dependencyName, node] of tree.children.entries()) {
      deps.set(dependencyName, node.version);
    }
    cache.set(pkg, deps);
    return deps;
  });
}
