"use strict";

const dedent = require("dedent");
const log = require("npmlog");
const path = require("path");
const semver = require("semver");
const _ = require("lodash");

const dependencyIsSatisfied = require("./utils/dependencyIsSatisfied");
const NpmUtilities = require("./NpmUtilities");

class Package {
  constructor(json, location) {
    let pkg = json;
    // TODO: less mutation by reference

    Object.defineProperties(this, {
      // read-only
      name: {
        enumerable: true,
        value: pkg.name,
      },
      location: {
        value: location,
      },
      // mutable
      version: {
        get() {
          return pkg.version;
        },
        set(version) {
          pkg.version = version;
        },
      },
      // collections
      dependencies: {
        get() {
          return pkg.dependencies;
        },
      },
      devDependencies: {
        get() {
          return pkg.devDependencies;
        },
      },
      peerDependencies: {
        get() {
          return pkg.peerDependencies;
        },
      },
      allDependencies: {
        get() {
          return Object.assign({}, pkg.devDependencies, pkg.dependencies);
        },
      },
      // immutable
      bin: {
        value: pkg.bin,
      },
      scripts: {
        value: pkg.scripts || {},
      },
      manifestLocation: {
        value: path.join(location, "package.json"),
      },
      nodeModulesLocation: {
        value: path.join(location, "node_modules"),
      },
      binLocation: {
        value: path.join(location, "node_modules", ".bin"),
      },
      // side-effects
      versionSerializer: {
        set(impl) {
          this.serialize = impl.serialize;
          pkg = impl.deserialize(pkg);
        },
      },
      serialize: {
        value: K => K,
        writable: true,
      },
      // "private"
      json: {
        get() {
          return pkg;
        },
      },
    });
  }

  isPrivate() {
    return !!this.json.private;
  }

  toJSON() {
    return this.serialize(_.cloneDeep(this.json));
  }

  /**
   * Run a NPM script in this package's directory
   * @param {String} script NPM script to run
   * @param {Function} callback
   */
  runScript(script, callback) {
    log.silly("runScript", script, this.name);

    if (this.scripts[script]) {
      NpmUtilities.runScriptInDir(
        script,
        {
          args: [],
          directory: this.location,
          npmClient: "npm",
        },
        callback
      );
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
      NpmUtilities.runScriptInDirSync(
        script,
        {
          args: [],
          directory: this.location,
          npmClient: "npm",
        },
        callback
      );
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
      log.warn(
        this.name,
        dedent`
          depends on "${dependency.name}@${expectedVersion}"
          instead of "${dependency.name}@${actualVersion}"
        `
      );
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

    return dependencyIsSatisfied(this.nodeModulesLocation, depName, this.allDependencies[depName]);
  }
}

module.exports = Package;
