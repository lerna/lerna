"use strict";

const semver = require("semver");
const prereleaseIdFromVersion = require("@lerna/prerelease-id-from-version");

/**
 * Represents a node in a PackageGraph.
 * @constructor
 * @param {!<Package>} pkg - A Package object to build the node from.
 */
class PackageGraphNode {
  constructor(pkg) {
    Object.defineProperties(this, {
      // immutable properties
      name: {
        enumerable: true,
        value: pkg.name,
      },
      location: {
        value: pkg.location,
      },
      prereleaseId: {
        // an existing prerelease ID only matters at the beginning
        value: prereleaseIdFromVersion(pkg.version),
      },
      // properties that might change over time
      version: {
        get() {
          return pkg.version;
        },
      },
      pkg: {
        get() {
          return pkg;
        },
      },
    });

    this.externalDependencies = new Map();
    this.localDependencies = new Map();
    this.localDependents = new Map();
  }

  /**
   * Determine if the Node satisfies a resolved semver range.
   * @see https://github.com/npm/npm-package-arg#result-object
   *
   * @param {!Result} resolved npm-package-arg Result object
   * @returns {Boolean}
   */
  satisfies({ gitCommittish, gitRange, fetchSpec }) {
    return semver.satisfies(this.version, gitCommittish || gitRange || fetchSpec);
  }

  /**
   * Returns a string representation of this node (its name)
   *
   * @returns {String}
   */
  toString() {
    return this.name;
  }
}

module.exports.PackageGraphNode = PackageGraphNode;
