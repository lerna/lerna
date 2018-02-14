"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const path = require("path");
const _ = require("lodash");

const NpmUtilities = require("./NpmUtilities");

function binSafeName(rawName) {
  return rawName[0] === "@" ? rawName.substring(rawName.indexOf("/") + 1) : rawName;
}

class Package {
  constructor(json, location, rootPath = location) {
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
      private: {
        value: Boolean(pkg.private),
      },
      resolved: {
        get() {
          return npa.resolve(pkg.name, path.relative(rootPath, location), rootPath);
        },
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
        value:
          typeof pkg.bin === "string"
            ? {
                [binSafeName(pkg.name)]: pkg.bin,
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
}

module.exports = Package;
