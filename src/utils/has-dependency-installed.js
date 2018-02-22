"use strict";

const log = require("npmlog");
const loadJsonFile = require("load-json-file");
const path = require("path");
const semver = require("semver");

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

  let retVal;
  try {
    const manifestLocation = path.join(pkg.nodeModulesLocation, depName, "package.json");
    const dependency = loadJsonFile.sync(manifestLocation);

    retVal = semver.satisfies(dependency.version, needVersion);
  } catch (e) {
    retVal = false;
  }

  return retVal;
}
