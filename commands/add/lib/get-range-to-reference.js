"use strict";

const semver = require("semver");

module.exports = getRangeToReference;

function getRangeToReference(spec, deps) {
  const current = deps[spec.name];
  const resolved = spec.type === "tag" ? `^${spec.version}` : spec.fetchSpec;

  if (current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
