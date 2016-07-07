// @flow

import objectAssign from "object-assign";
import path from "path";
import semver from "semver";
import NpmUtilities from "./NpmUtilities";
import logger from "./logger";

const unsafeRequire = require;

export default class Package {
  _package: Object;
  _location: string;

  constructor(pkg: Object, location: string) {
    this._package = pkg;
    this._location = location;
  }

  get name(): string {
    return this._package.name;
  }

  get location(): string {
    return this._location;
  }

  get nodeModulesLocation(): string {
    return path.join(this._location, "node_modules");
  }

  get version(): string {
    return this._package.version;
  }

  set version(version: string) {
    this._package.version = version;
  }

  get bin(): ?string {
    return this._package.bin;
  }

  get dependencies(): ?Object {
    return this._package.dependencies;
  }

  get devDependencies(): ?Object {
    return this._package.devDependencies;
  }

  get peerDependencies(): ?Object {
    return this._package.peerDependencies;
  }

  get allDependencies(): Object {
    return objectAssign(
      {},
      this.devDependencies,
      this.dependencies
    );
  }

  get scripts(): Object {
    return this._package.scripts || {};
  }

  isPrivate(): boolean {
    return !!this._package.private;
  }

  toJsonString(): string {
    return JSON.stringify(this._package, null, 2) + "\n";
  }

  /**
   * Run a NPM script in this package's directory
   * @param {String} script NPM script to run
   * @param {Function} callback
   */
  runScript(script: string, callback: Function) {
    if (this.scripts[script]) {
      NpmUtilities.runScriptInDir(script, [], this.location, callback);
    } else {
      callback();
    }
  }

  /**
   * Determine if a dependency version satisfies the requirements of this package
   * @param {Package} dependency
   * @param {Boolean} showWarning
   * @returns {Boolean}
   */
  hasMatchingDependency(dependency: Package, showWarning: boolean = false) {
    const expectedVersion = this.allDependencies[dependency.name];
    const actualVersion = dependency.version;

    if (!expectedVersion) {
      return false;
    }

    // check if semantic versions are compatible
    if (semver.satisfies(actualVersion, expectedVersion)) {
      return true;
    }

    if (showWarning) {
      logger.warn(
        `Version mismatch inside "${this.name}". ` +
        `Depends on "${dependency.name}@${expectedVersion}" ` +
        `instead of "${dependency.name}@${actualVersion}".`
      );
    }

    return false;
  }

  /**
   * Determine if a dependency has already been installed for this package
   * @param {String} dependency Name of the dependency
   * @returns {Boolean}
   */
  hasDependencyInstalled(dependency: string) {
    const packageJson = path.join(this.nodeModulesLocation, dependency, "package.json");
    try {
      return semver.satisfies(
        unsafeRequire(packageJson).version,
        this.allDependencies[dependency]
      );
    } catch (e) {
      return false;
    }
  }
}
