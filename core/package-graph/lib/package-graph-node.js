"use strict";

const semver = require("semver");
const { prereleaseIdFromVersion } = require("@lerna/prerelease-id-from-version");

const PKG = Symbol("pkg");

/**
 * A node in a PackageGraph.
 */
class PackageGraphNode {
  /**
   * @param {import("@lerna/package").Package} pkg
   */
  constructor(pkg) {
    this.name = pkg.name;
    this[PKG] = pkg;

    // omit raw pkg from default util.inspect() output
    Object.defineProperty(this, PKG, { enumerable: false });

    /** @type {Map<string, import("npm-package-arg").Result>} */
    this.externalDependencies = new Map();

    /** @type {Map<string, import("npm-package-arg").Result>} */
    this.localDependencies = new Map();

    /** @type {Map<string, PackageGraphNode>} */
    this.localDependents = new Map();
  }

  get location() {
    return this[PKG].location;
  }

  get pkg() {
    return this[PKG];
  }

  get prereleaseId() {
    return prereleaseIdFromVersion(this.version);
  }

  get version() {
    return this[PKG].version;
  }

  /**
   * Determine if the Node satisfies a resolved semver range.
   * @see https://github.com/npm/npm-package-arg#result-object
   *
   * @param {import('npm-package-arg').Result} resolved
   */
  satisfies({ gitCommittish, gitRange, fetchSpec }) {
    return semver.satisfies(this.version, gitCommittish || gitRange || fetchSpec);
  }

  /**
   * A string representation of the node (just the package name).
   */
  toString() {
    return this.name;
  }
}

module.exports.PackageGraphNode = PackageGraphNode;
