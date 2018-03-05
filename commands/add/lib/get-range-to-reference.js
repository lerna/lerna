"use strict";

const semver = require("semver");

module.exports = getRangeToReference;

function getRangeToReference(current, available, requested) {
  const resolved = requested === "latest" ? `^${available}` : requested;

  if (current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
