"use strict";

const log = require("npmlog");
const path = require("path");
const readPkg = require("read-pkg");
const semver = require("semver");

module.exports = dependencyIsSatisfied;

function dependencyIsSatisfied(dir, depName, needVersion) {
  log.silly("dependencyIsSatisfied", [depName, needVersion, dir]);

  let retVal;
  try {
    const pkg = readPkg.sync(path.join(dir, depName, "package.json"), { normalize: false });
    retVal = semver.satisfies(pkg.version, needVersion);
  } catch (e) {
    retVal = false;
  }

  log.verbose("dependencyIsSatisfied", depName, retVal);
  return retVal;
}
