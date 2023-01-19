import { Result } from "npm-package-arg";
import semver from "semver";
import { Package } from "../package";
import { prereleaseIdFromVersion } from "../prerelease-id-from-version";

const PKG = Symbol("pkg");

/**
 * A node in a PackageGraph.
 */
export class PackageGraphNode {
  name: string;
  externalDependencies: Map<string, Result>;
  localDependencies: Map<string, Result>;
  localDependents: Map<string, PackageGraphNode>;
  [PKG]: Package;

  constructor(pkg: Package) {
    this.name = pkg.name;
    this[PKG] = pkg;

    // omit raw pkg from default util.inspect() output
    Object.defineProperty(this, PKG, { enumerable: false });

    this.externalDependencies = new Map();
    this.localDependencies = new Map();
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
   * @param {!Result} resolved npm-package-arg Result object
   */
  satisfies({ gitCommittish, gitRange, fetchSpec }: any): boolean {
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
