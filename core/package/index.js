"use strict";

const npa = require("npm-package-arg");
const path = require("path");

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
    const resolved = npa.resolve(pkg.name, path.relative(rootPath, location), rootPath);

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
        value: Object.assign({}, resolved),
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
      // "private"
      json: {
        get() {
          return pkg;
        },
      },
    });
  }

  updateLocalDependency(resolved, depVersion, savePrefix) {
    const depName = resolved.name;

    // first, try runtime dependencies
    let depCollection = this.json.dependencies;

    // fall back to devDependencies (it will always be one of these two)
    if (!depCollection || !depCollection[depName]) {
      depCollection = this.json.devDependencies;
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

      // always serialize the full git+ssh url (identical to previous resolved.saveSpec)
      depCollection[depName] = hosted.sshurl({ noGitPlus: false, noCommittish: false });
    } else if (resolved.gitRange) {
      // a git url with matching gitRange (#semver:^1.2.3)
      const { hosted } = resolved; // take that, lint!
      hosted.committish = `semver:${savePrefix}${depVersion}`;

      // always serialize the full git+ssh url (identical to previous resolved.saveSpec)
      depCollection[depName] = hosted.sshurl({ noGitPlus: false, noCommittish: false });
    }
  }

  toJSON() {
    return shallowCopy(this.json);
  }
}

module.exports = Package;
