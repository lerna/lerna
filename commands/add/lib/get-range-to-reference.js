"use strict";

const semver = require("semver");

module.exports = getRangeToReference;

function getRangeToReference(spec, deps, prefix) {
  const current = deps[spec.name];
  const resolved = spec.type === "tag" ? `${prefix}${spec.version}` : spec.fetchSpec;

  if (prefix && current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
