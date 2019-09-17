"use strict";

const npa = require("npm-package-arg");
const path = require("path");
const loadJsonFile = require("load-json-file");
const writePkg = require("write-pkg");

// symbol used to "hide" internal state
const PKG = Symbol("pkg");

function binSafeName({ name, scope }) {
  return scope ? name.substring(scope.length + 1) : name;
}

// package.json files are not that complicated, so this is intentionally naïve
function shallowCopy(json) {
  return Object.keys(json).reduce((obj, key) => {
    const val = json[key];

    /* istanbul ignore if */
    if (Array.isArray(val)) {
      obj[key] = val.slice();
    } else if (val && typeof val === "object") {
      obj[key] = Object.assign({}, val);
    } else {
      obj[key] = val;
    }

    return obj;
  }, {});
}

class Package {
  constructor(pkg, location, rootPath = location) {
    // npa will throw an error if the name is invalid
    const resolved = npa.resolve(pkg.name, `file:${path.relative(rootPath, location)}`, rootPath);

    Object.defineProperties(this, {
      // read-only
      name: {
        enumerable: true,
        value: pkg.name,
      },
      location: {
        value: location,
      },
      private: {
        value: Boolean(pkg.private),
      },
      resolved: {
        value: resolved,
      },
      rootPath: {
        value: rootPath,
      },
      // internal state is "private"
      [PKG]: {
        configurable: true,
        value: pkg,
      },
      // safer than instanceof across module boundaries
      __isLernaPackage: {
        value: true,
      },
      // immutable
      bin: {
        value:
          typeof pkg.bin === "string"
            ? {
                [binSafeName(resolved)]: pkg.bin,
              }
            : Object.assign({}, pkg.bin),
      },
      scripts: {
        value: Object.assign({}, pkg.scripts),
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
    });
  }

  // accessors
  get version() {
    return this[PKG].version;
  }

  set version(version) {
    this[PKG].version = version;
  }

  get contents() {
    // if modified with setter, use that value
    if (this._contents) {
      return this._contents;
    }

    // if provided by pkg.publishConfig.directory value
    if (this[PKG].publishConfig && this[PKG].publishConfig.directory) {
      return path.join(this.location, this[PKG].publishConfig.directory);
    }

    // default to package root
    return this.location;
  }

  set contents(subDirectory) {
    Object.defineProperty(this, "_contents", {
      value: path.join(this.location, subDirectory),
    });
  }

  // "live" collections
  get dependencies() {
    return this[PKG].dependencies;
  }

  get devDependencies() {
    return this[PKG].devDependencies;
  }

  get optionalDependencies() {
    return this[PKG].optionalDependencies;
  }

  get peerDependencies() {
    return this[PKG].peerDependencies;
  }

  /**
   * Map-like retrieval of arbitrary values
   * @param {String} key field name to retrieve value
   * @returns {Any} value stored under key, if present
   */
  get(key) {
    return this[PKG][key];
  }

  /**
   * Map-like storage of arbitrary values
   * @param {String} key field name to store value
   * @param {Any} val value to store
   * @returns {Package} instance for chaining
   */
  set(key, val) {
    this[PKG][key] = val;

    return this;
  }

  /**
   * Provide shallow copy for munging elsewhere
   * @returns {Object}
   */
  toJSON() {
    return shallowCopy(this[PKG]);
  }

  /**
   * Refresh internal state from disk (e.g., changed by external lifecycles)
   */
  refresh() {
    return loadJsonFile(this.manifestLocation).then(pkg => {
      // overwrite configurable property
      Object.defineProperty(this, PKG, {
        value: pkg,
      });

      return this;
    });
  }

  /**
   * Write manifest changes to disk
   * @returns {Promise} resolves when write finished
   */
  serialize() {
    return writePkg(this.manifestLocation, this[PKG]).then(() => this);
  }

  /**
   * Mutate local dependency spec according to type
   * @param {Object} resolved npa metadata
   * @param {String} depVersion semver
   * @param {String} savePrefix npm_config_save_prefix
   */
  updateLocalDependency(resolved, depVersion, savePrefix) {
    const depName = resolved.name;

    // first, try runtime dependencies
    let depCollection = this.dependencies;

    // try optionalDependencies if that didn't work
    if (!depCollection || !depCollection[depName]) {
      depCollection = this.optionalDependencies;
    }

    // fall back to devDependencies
    if (!depCollection || !depCollection[depName]) {
      depCollection = this.devDependencies;
    }

    if (resolved.registry || resolved.type === "directory") {
      // a version (1.2.3) OR range (^1.2.3) OR directory (file:../foo-pkg)
      depCollection[depName] = `${savePrefix}${depVersion}`;
    } else if (resolved.gitCommittish) {
      // a git url with matching committish (#v1.2.3 or #1.2.3)
      const [tagPrefix] = /^\D*/.exec(resolved.gitCommittish);

      // update committish
      const { hosted } = resolved; // take that, lint!
      hosted.committish = `${tagPrefix}${depVersion}`;

      // always serialize the full url (identical to previous resolved.saveSpec)
      depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
    } else if (resolved.gitRange) {
      // a git url with matching gitRange (#semver:^1.2.3)
      const { hosted } = resolved; // take that, lint!
      hosted.committish = `semver:${savePrefix}${depVersion}`;

      // always serialize the full url (identical to previous resolved.saveSpec)
      depCollection[depName] = hosted.toString({ noGitPlus: false, noCommittish: false });
    }
  }
}

function lazy(ref, dir = ".") {
  if (typeof ref === "string") {
    const location = path.resolve(path.basename(ref) === "package.json" ? path.dirname(ref) : ref);
    const manifest = loadJsonFile.sync(path.join(location, "package.json"));

    return new Package(manifest, location);
  }

  // don't use instanceof because it fails across nested module boundaries
  if ("__isLernaPackage" in ref) {
    return ref;
  }

  // assume ref is a json object
  return new Package(ref, dir);
}

module.exports = Package;
module.exports.lazy = lazy;
