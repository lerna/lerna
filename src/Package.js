"use strict";

const npa = require("npm-package-arg");
const path = require("path");
const _ = require("lodash");

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
}

module.exports = Package;
