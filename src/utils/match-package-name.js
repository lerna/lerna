"use strict";

const minimatch = require("minimatch");

module.exports = matchPackageName;

/**
 * A predicate that determines if a given package name satisfies a glob.
 *
 * @param {!String} name The package name
 * @param {String|Array<String>} filters The glob (or globs) to match a package name against
 * @param {Boolean} negate Negate glob pattern matches
 * @return {Boolean} The packages with a name matching the glob
 */
function matchPackageName(name, filters, negate) {
  // If there isn't a filter then we can just return the package.
  if (!filters) {
    return true;
  }

  // Include/exlude with no arguments implies splat.
  // For example: `--hoist` is equivalent to `--hoist=**`.
  // The double star here is to account for scoped packages.
  if (filters === true) {
    filters = "**"; // eslint-disable-line no-param-reassign
  }

  if (!Array.isArray(filters)) {
    filters = [filters]; // eslint-disable-line no-param-reassign
  }

  if (negate) {
    return filters.every(pattern => !minimatch(name, pattern));
  }

  return filters.some(pattern => minimatch(name, pattern));
}
