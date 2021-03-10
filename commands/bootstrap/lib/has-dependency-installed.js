"use strict";

const log = require("npmlog");
const readPackageTree = require("read-package-tree");
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
  return new Promise((resolve, reject) => {
    if (cache.has(pkg)) {
      return resolve(cache.get(pkg));
    }

    readPackageTree(pkg.location, filterTopLevel, (err, { children }) => {
      if (err) {
        return reject(err);
      }

      /** @type {InstalledDependencies} */
      const deps = new Map(children.map(({ package: { name, version } }) => [name, version]));
      cache.set(pkg, deps);
      resolve(deps);
    });
  });
}

/**
 * @param {import("read-package-tree").Node} node
 * @param {string} kidName
 */
function filterTopLevel(node, kidName) {
  if (node.parent) {
    return false;
  }

  return Boolean(
    (node.package.dependencies && node.package.dependencies[kidName]) ||
      (node.package.devDependencies && node.package.devDependencies[kidName]) ||
      (node.package.peerDependencies && node.package.peerDependencies[kidName]) ||
      (node.package.optionalDependencies && node.package.optionalDependencies[kidName])
  );
}
