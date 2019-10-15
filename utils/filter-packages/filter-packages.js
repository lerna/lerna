"use strict";

const util = require("util");
const multimatch = require("multimatch");
const log = require("npmlog");

const ValidationError = require("@lerna/validation-error");

module.exports = filterPackages;

/**
 * Filters a given set of packages and returns all packages that match the scope glob
 * and do not match the ignore glob
 *
 * @param {!Array.<Package>} packagesToFilter The packages to filter
 * @param {Array.<String>} include A list of globs to match the package name against
 * @param {Array.<String>} exclude A list of globs to filter the package name against
 * @param {Boolean} showPrivate When false, filter out private packages
 * @param {Boolean} continueIfNoMatch When true, do not throw if no package is matched
 * @return {Array.<Package>} The packages with a name matching the glob
 * @throws when a given glob would produce an empty list of packages and `continueIfNoMatch` is not set.
 */
function filterPackages(packagesToFilter, include = [], exclude = [], showPrivate, continueIfNoMatch) {
  const filtered = new Set(packagesToFilter);
  const patterns = [].concat(arrify(include), negate(exclude));

  if (showPrivate === false) {
    for (const pkg of filtered) {
      if (pkg.private) {
        filtered.delete(pkg);
      }
    }
  }

  if (patterns.length) {
    log.info("filter", patterns);

    if (!include.length) {
      // only excludes needs to select all items first
      // globstar is for matching scoped packages
      patterns.unshift("**");
    }

    const pnames = Array.from(filtered).map(pkg => pkg.name);
    const chosen = new Set(multimatch(pnames, patterns));

    for (const pkg of filtered) {
      if (!chosen.has(pkg.name)) {
        filtered.delete(pkg);
      }
    }

    if (!filtered.size && !continueIfNoMatch) {
      throw new ValidationError("EFILTER", util.format("No packages remain after filtering", patterns));
    }
  }

  return Array.from(filtered);
}

function arrify(thing) {
  if (!thing) {
    return [];
  }

  if (!Array.isArray(thing)) {
    return [thing];
  }

  return thing;
}

function negate(patterns) {
  return arrify(patterns).map(pattern => `!${pattern}`);
}
