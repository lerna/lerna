"use strict";

const dedent = require("dedent");
const findUp = require("find-up");
const globParent = require("glob-parent");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const path = require("path");

const ValidationError = require("@lerna/validation-error");
const Package = require("@lerna/package");

const DEFAULT_PACKAGE_GLOB = "packages/*";

class Project {
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

  get version() {
    return this.lernaJson.version;
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

      return this.packageJson.workspaces.packages || this.packageJson.workspaces;
    }
    return this.lernaJson.packages || [DEFAULT_PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent).map(parentDir => path.resolve(this.rootPath, parentDir));
  }

  get packageJson() {
    if (!this._packageJson) {
      try {
        this._packageJson = loadJsonFile.sync(this.packageJsonLocation);
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

  isIndependent() {
    return this.version === "independent";
  }
}

module.exports = Project;
