"use strict";

const cosmiconfig = require("cosmiconfig");
const dedent = require("dedent");
const globParent = require("glob-parent");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const path = require("path");
const writeJsonFile = require("write-json-file");

const ValidationError = require("@lerna/validation-error");
const Package = require("@lerna/package");

const DEFAULT_PACKAGE_GLOB = "packages/*";

class Project {
  constructor(cwd) {
    const explorer = cosmiconfig("lerna", {
      js: false, // not unless we store version somewhere else...
      rc: "lerna.json",
      rcStrictJson: true,
      sync: true,
      transform: obj => {
        // normalize command-specific config namespace
        if (obj.config.commands) {
          obj.config.command = obj.config.commands;
          delete obj.config.commands;
        }

        return obj;
      },
    });

    let loaded;

    try {
      loaded = explorer.load(cwd);
    } catch (err) {
      // don't swallow syntax errors
      if (err.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }
    }

    // cosmiconfig returns null when nothing is found
    loaded = loaded || {
      // No need to distinguish between missing and empty,
      // saves a lot of noisy guards elsewhere
      config: {},
      // path.resolve(".", ...) starts from process.cwd()
      filepath: path.resolve(cwd || ".", "lerna.json"),
    };

    this.config = loaded.config;
    this.rootPath = path.dirname(loaded.filepath);
    log.verbose("rootPath", this.rootPath);

    this.lernaConfigLocation = loaded.filepath;
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
  }

  get version() {
    return this.config.version;
  }

  set version(val) {
    this.config.version = val;
  }

  get packageConfigs() {
    if (this.config.useWorkspaces) {
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

    return this.config.packages || [DEFAULT_PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent).map(parentDir => path.resolve(this.rootPath, parentDir));
  }

  get packageJson() {
    if (!this._packageJson) {
      try {
        this._packageJson = loadJsonFile.sync(this.packageJsonLocation);

        if (!this._packageJson.name) {
          // npm-lifecycle chokes if this is missing, so default like npm init does
          this._packageJson.name = path.basename(path.dirname(this.packageJsonLocation));
        }
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

  serializeConfig() {
    // TODO: might be package.json prop
    return writeJsonFile(this.lernaConfigLocation, this.config, { indent: 2, detectIndent: true }).then(
      () => this.lernaConfigLocation
    );
  }
}

module.exports = Project;
