"use strict";

const dedent = require("dedent");
const log = require("npmlog");
const semver = require("semver");

module.exports = hasMatchingDependency;

/**
 * Determine if a dependency version satisfies the requirements of this package
 * @param {Package} inPkg The Package instance to check for match
 * @param {Package} dependency
 * @returns {Boolean}
 */
function hasMatchingDependency(inPkg, dependency) {
  log.silly("hasMatchingDependency", inPkg.name, dependency.name);

  const expectedVersion = inPkg.allDependencies[dependency.name];
  const actualVersion = dependency.version;

  if (!expectedVersion) {
    return false;
  }

  // check if semantic versions are compatible
  if (semver.satisfies(actualVersion, expectedVersion)) {
    return true;
  }

  log.warn(
    inPkg.name,
    dedent`
      depends on "${dependency.name}@${expectedVersion}"
      instead of "${dependency.name}@${actualVersion}"
    `
  );

  return false;
}
