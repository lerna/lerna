"use strict";

const semver = require("semver");

module.exports.prereleaseIdFromVersion = prereleaseIdFromVersion;

function prereleaseIdFromVersion(version) {
  return (semver.prerelease(version) || []).shift();
}
