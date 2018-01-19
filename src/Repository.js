"use strict";

const dedent = require("dedent");
const findUp = require("find-up");
const globParent = require("glob-parent");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const path = require("path");
const readPkg = require("read-pkg");
const semver = require("semver");

const dependencyIsSatisfied = require("./utils/dependencyIsSatisfied");
const ValidationError = require("./utils/ValidationError");
const Package = require("./Package");

const DEFAULT_PACKAGE_GLOB = "packages/*";

class Repository {
  constructor(cwd) {
    const lernaJsonLocation =
      // findUp returns null when not found
      findUp.sync("lerna.json", { cwd }) ||
      // path.resolve(".", ...) starts from process.cwd()
      path.resolve(cwd || ".", "lerna.json");

    this.rootPath = path.dirname(lernaJsonLocation);
    log.verbose("rootPath", this.rootPath);

    this.lernaJsonLocation = lernaJsonLocation;
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
  }

  get lernaJson() {
    if (!this._lernaJson) {
      try {
        this._lernaJson = loadJsonFile.sync(this.lernaJsonLocation);
      } catch (err) {
        // don't swallow syntax errors
        if (err.name === "JSONError") {
          throw new ValidationError(err.name, err.message);
        }
        // No need to distinguish between missing and empty,
        // saves a lot of noisy guards elsewhere
        this._lernaJson = {};
      }
    }

    return this._lernaJson;
  }

  get initVersion() {
    return this.lernaJson.lerna;
  }

  get version() {
    return this.lernaJson.version;
  }

  get nodeModulesLocation() {
    return path.join(this.rootPath, "node_modules");
  }

  get packageConfigs() {
    if (this.lernaJson.useWorkspaces) {
      if (!this.packageJson.workspaces) {
        throw new ValidationError(
          "EWORKSPACES",
          dedent`
            Yarn workspaces need to be defined in the root package.json.
            See: https://github.com/lerna/lerna#--use-workspaces
          `
        );
      }

      return this.packageJson.workspaces;
    }
    return this.lernaJson.packages || [DEFAULT_PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent).map(parentDir => path.resolve(this.rootPath, parentDir));
  }

  get packageJson() {
    if (!this._packageJson) {
      try {
        this._packageJson = readPkg.sync(this.packageJsonLocation, { normalize: false });
      } catch (err) {
        // don't swallow syntax errors
        if (err.name === "JSONError") {
          throw new ValidationError(err.name, err.message);
        }
        // try again next time
        this._packageJson = null;
      }
    }

    return this._packageJson;
  }

  get package() {
    if (!this._package) {
      this._package = new Package(this.packageJson, this.rootPath);
    }

    return this._package;
  }

  // Legacy
  get versionLocation() {
    return path.join(this.rootPath, "VERSION");
  }

  isCompatibleLerna(cliVersion) {
    return semver.satisfies(cliVersion, `^${this.initVersion}`);
  }

  isIndependent() {
    return this.version === "independent";
  }

  hasDependencyInstalled(depName, version) {
    log.silly("hasDependencyInstalled", "ROOT", depName, version);

    return dependencyIsSatisfied(this.nodeModulesLocation, depName, version);
  }
}

module.exports = Repository;
