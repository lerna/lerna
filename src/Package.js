import dedent from "dedent";
import log from "npmlog";
import path from "path";
import semver from "semver";

import dependencyIsSatisfied from "./utils/dependencyIsSatisfied";
import NpmUtilities from "./NpmUtilities";

export default class Package {
  constructor(pkg, location) {
    this._package = pkg;
    this._location = location;
  }

  get name() {
    // Anonymous packages will appear in the log messages as directory paths.
    return this._package.name || this._location;
  }

  get location() {
    return this._location;
  }

  get nodeModulesLocation() {
    return path.join(this._location, "node_modules");
  }

  get version() {
    return this._package.version;
  }

  set version(version) {
    this._package.version = version;
  }

  get bin() {
    return this._package.bin;
  }

  get dependencies() {
    return this._package.dependencies;
  }

  get devDependencies() {
    return this._package.devDependencies;
  }

  get peerDependencies() {
    return this._package.peerDependencies;
  }

  get allDependencies() {
    return Object.assign(
      {},
      this.devDependencies,
      this.dependencies
    );
  }

  get scripts() {
    return this._package.scripts || {};
  }

  hasName() {
    return !!this._package.name;
  }

  isPrivate() {
    return !!this._package.private;
  }

  toJSON() {
    return this._package;
  }

  /**
   * Run a NPM script in this package's directory
   * @param {String} script NPM script to run
   * @param {Function} callback
   */
  runScript(script, callback) {
    log.silly("runScript", script, this.name);

    if (this.scripts[script]) {
      NpmUtilities.runScriptInDir(script, [], this.location, callback);
    } else {
      callback();
    }
  }

  /**
   * Run a NPM script synchronously in this package's directory
   * @param {String} script NPM script to run
   * @param {Function} callback
   */
  runScriptSync(script, callback) {
    log.silly("runScriptSync", script, this.name);

    if (this.scripts[script]) {
      NpmUtilities.runScriptInDirSync(script, [], this.location, callback);
    } else {
      callback();
    }
  }

  /**
   * Determine if a dependency version satisfies the requirements of this package
   * @param {Package} dependency
   * @param {Boolean} doWarn
   * @returns {Boolean}
   */
  hasMatchingDependency(dependency, doWarn) {
    log.silly("hasMatchingDependency", this.name, dependency.name);

    const expectedVersion = this.allDependencies[dependency.name];
    const actualVersion = dependency.version;

    if (!expectedVersion) {
      return false;
    }

    // check if semantic versions are compatible
    if (semver.satisfies(actualVersion, expectedVersion)) {
      return true;
    }

    if (doWarn) {
      log.warn(this.name, dedent`
        depends on "${dependency.name}@${expectedVersion}"
        instead of "${dependency.name}@${actualVersion}"
      `);
    }

    return false;
  }

  /**
   * Determine if a dependency has already been installed for this package
   * @param {String} depName Name of the dependency
   * @returns {Boolean}
   */
  hasDependencyInstalled(depName) {
    log.silly("hasDependencyInstalled", this.name, depName);

    return dependencyIsSatisfied(
      this.nodeModulesLocation, depName, this.allDependencies[depName]
    );
  }
}
