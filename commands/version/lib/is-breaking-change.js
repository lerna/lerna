"use strict";

const semver = require("semver");

module.exports.isBreakingChange = isBreakingChange;

/**
 * @param {string} currentVersion
 * @param {string} nextVersion
 */
function isBreakingChange(currentVersion, nextVersion) {
  const releaseType = semver.diff(currentVersion, nextVersion);
  let breaking;

  if (releaseType === "major") {
    // self-evidently
    breaking = true;
  } else if (releaseType === "minor") {
    // 0.1.9 => 0.2.0 is breaking
    breaking = semver.lt(currentVersion, "1.0.0");
  } else if (releaseType === "patch") {
    // 0.0.1 => 0.0.2 is breaking(?)
    breaking = semver.lt(currentVersion, "0.1.0");
  } else {
    // versions are equal, or any prerelease
    breaking = false;
  }

  return breaking;
}
