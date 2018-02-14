"use strict";

const log = require("npmlog");
const loadJsonFile = require("load-json-file");
const path = require("path");
const semver = require("semver");

module.exports = hasDependencyInstalled;

/**
 * Determine if a dependency has already been installed for this package
 * @param {Package} inPkg The Package instance to check for installed dependency
 * @param {String} depName Name of the dependency
 * @param {String} [version] Optional version to test with, defaults to existing spec
 * @returns {Boolean}
 */
function hasDependencyInstalled(inPkg, depName, version) {
  log.silly("hasDependencyInstalled", inPkg.name, depName);

  const needVersion = version || inPkg.allDependencies[depName];

  let retVal;
  try {
    const manifestLocation = path.join(inPkg.nodeModulesLocation, depName, "package.json");
    const dependency = loadJsonFile.sync(manifestLocation);

    retVal = semver.satisfies(dependency.version, needVersion);
  } catch (e) {
    retVal = false;
  }

  return retVal;
}
