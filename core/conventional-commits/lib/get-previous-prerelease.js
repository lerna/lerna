"use strict";

const log = require("npmlog");
const semver = require("semver");
const childProcess = require("@lerna/child-process");

module.exports.getPreviousPrerelease = getPreviousPrerelease;

/**
 * Finds the previous version with the current raw version and
 * given prereleaseId. Falls back to the given current version.
 *
 * @param {string} currentVersion
 * @param {string} name (Only used in independent mode)
 * @param {string} prereleaseId
 */
function getPreviousPrerelease(currentVersion, name, prereleaseId) {
  const coerced = semver.coerce(currentVersion);
  if (!prereleaseId || !coerced) {
    return currentVersion;
  }

  const namePrefix = name ? `${name}@` : "";
  const tagSearch = `${namePrefix}${coerced.version}-${prereleaseId}*`;
  const gitTagArgs = ["tag", "--list", tagSearch, "--sort", "-version:refname"];
  const matchingTags = childProcess.execSync("git", gitTagArgs);
  if (!matchingTags) {
    return currentVersion;
  }

  const latestTag = matchingTags.split("\n")[0];
  const previousPrerelease = latestTag.split("@").pop();
  log.silly("getPreviousPrerelease", "found previous prerelease", previousPrerelease);
  return previousPrerelease;
}
