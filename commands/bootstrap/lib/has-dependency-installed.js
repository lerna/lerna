"use strict";

const log = require("npmlog");
const readPackageTree = require("read-package-tree");
const semver = require("semver");

// cache installed lookups
const cache = new Map();

module.exports = hasDependencyInstalled;

/**
 * Determine if a dependency has already been installed for this package
 * @param {Package} pkg The Package instance to check for installed dependency
 * @param {String} depName Name of the dependency
 * @param {String} needVersion version to test with
 * @returns {Boolean}
 */
function hasDependencyInstalled(pkg, depName, needVersion) {
  log.silly("hasDependencyInstalled", pkg.name, depName);

  return getInstalled(pkg).then(
    versions => versions.has(depName) && semver.satisfies(versions.get(depName), needVersion)
  );
}

function getInstalled(pkg) {
  return new Promise((resolve, reject) => {
    if (cache.has(pkg)) {
      return resolve(cache.get(pkg));
    }

    readPackageTree(pkg.location, filterTopLevel, (err, { children }) => {
      if (err) {
        return reject(err);
      }

      const deps = new Map(children.map(({ package: { name, version } }) => [name, version]));
      cache.set(pkg, deps);
      resolve(deps);
    });
  });
}

function filterTopLevel(node, kidName) {
  if (node.parent) {
    return false;
  }

  return (
    (node.package.dependencies && node.package.dependencies[kidName]) ||
    (node.package.devDependencies && node.package.devDependencies[kidName]) ||
    (node.package.peerDependencies && node.package.peerDependencies[kidName]) ||
    (node.package.optionalDependencies && node.package.optionalDependencies[kidName])
  );
}
