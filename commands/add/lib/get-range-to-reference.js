"use strict";

const npa = require("npm-package-arg");
const path = require("path");
const semver = require("semver");

module.exports = getRangeToReference;

function getRangeToReference(spec, deps, loc, prefix) {
  const current = deps[spec.name];
  const resolved = spec.type === "tag" ? `${prefix}${spec.version}` : spec.fetchSpec;

  if (spec.saveRelativeFileSpec) {
    // ALWAYS render a POSIX file: spec, Windows can deal with it
    const where = path.posix.normalize(loc);

    // "spec.version" has been resolved to pkg.location in getPackageVersion()
    const relativeFileSpec = `file:${path.posix.relative(where, spec.version)}`;

    return npa.resolve(spec.name, relativeFileSpec, where).saveSpec;
  }

  if (prefix && current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
