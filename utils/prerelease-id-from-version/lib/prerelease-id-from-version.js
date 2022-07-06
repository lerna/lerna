"use strict";

const semver = require("semver");

module.exports.prereleaseIdFromVersion = prereleaseIdFromVersion;

/**
 * @param {string} version
 * @returns {string|undefined}
 */
function prereleaseIdFromVersion(version) {
  return (semver.prerelease(version) || []).shift();
}
