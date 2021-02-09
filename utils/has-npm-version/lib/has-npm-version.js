"use strict";

const semver = require("semver");
const childProcess = require("@lerna/child-process");

module.exports.hasNpmVersion = hasNpmVersion;

function hasNpmVersion(range) {
  return rangeSatisfies(getNpmVersion(), range);
}

function rangeSatisfies(npmVersion, range) {
  return Boolean(semver.satisfies(npmVersion, range));
}

function getNpmVersion() {
  return childProcess.execSync("npm", ["--version"]);
}
