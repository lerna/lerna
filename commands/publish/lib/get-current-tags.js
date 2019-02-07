"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const childProcess = require("@lerna/child-process");

module.exports = getCurrentTags;

function getCurrentTags(execOpts, matchingPattern) {
  log.silly("getCurrentTags");

  const opts = Object.assign({}, execOpts, {
    // don't reject due to non-zero exit code when there are no results
    reject: false,
  });

  return childProcess
    .exec("git", ["tag", "--sort", "version:refname", "--points-at", "HEAD", "--list", matchingPattern], opts)
    .then(listPackageNames);
}

function listPackageNames(result) {
  return result.stdout
    .split("\n")
    .map(tag => tag && npa(tag).name)
    .filter(Boolean);
}
