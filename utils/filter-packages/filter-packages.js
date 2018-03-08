"use strict";

const matchPackageName = require("@lerna/match-package-name");
const ValidationError = require("@lerna/validation-error");

module.exports = filterPackages;

/**
 * Filters a given set of packages and returns all packages that match the scope glob
 * and do not match the ignore glob
 *
 * @param {!Array.<Package>} packagesToFilter The packages to filter
 * @param {Object} filters The scope and ignore filters.
 * @param {String} filters.scope glob The glob to match the package name against
 * @param {String} filters.ignore glob The glob to filter the package name against
 * @param {Boolean} showPrivate When false, filter out private packages
 * @return {Array.<Package>} The packages with a name matching the glob
 * @throws when a given glob would produce an empty list of packages
 */
function filterPackages(packagesToFilter, { scope, ignore }, showPrivate) {
  let packages = packagesToFilter.slice();

  if (showPrivate === false) {
    packages = packages.filter(pkg => !pkg.private);
  }

  if (scope) {
    packages = packages.filter(pkg => matchPackageName(pkg.name, scope));

    if (!packages.length) {
      throw new ValidationError("EFILTER", `No packages found that match scope '${scope}'`);
    }
  }

  if (ignore) {
    packages = packages.filter(pkg => matchPackageName(pkg.name, ignore, true));

    if (!packages.length) {
      throw new ValidationError("EFILTER", `No packages remain after ignoring '${ignore}'`);
    }
  }

  return packages;
}
