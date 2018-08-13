"use strict";

const semver = require("semver");
const childProcess = require("@lerna/child-process");

module.exports = hasNpmVersion;
module.exports.makePredicate = makePredicate;

function hasNpmVersion(range) {
  return rangeSatisfies(getNpmVersion(), range);
}

function makePredicate() {
  const npmVersion = getNpmVersion();

  return range => rangeSatisfies(npmVersion, range);
}

function rangeSatisfies(npmVersion, range) {
  return Boolean(semver.satisfies(npmVersion, range));
}

function getNpmVersion() {
  return childProcess.execSync("npm", ["--version"]);
}
