"use strict";

const { cosmiconfigSync } = require("cosmiconfig");
const dedent = require("dedent");
const globby = require("globby");
const globParent = require("glob-parent");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const pMap = require("p-map");
const path = require("path");
const writeJsonFile = require("write-json-file");

const { ValidationError } = require("@lerna/validation-error");
const { Package } = require("@lerna/package");
const { applyExtends } = require("./lib/apply-extends");
const { deprecateConfig } = require("./lib/deprecate-config");
const { makeFileFinder, makeSyncFileFinder } = require("./lib/make-file-finder");

/**
 * @typedef {object} ProjectConfig
 * @property {string[]} packages
 * @property {boolean} useWorkspaces
 * @property {string} version
 */

/**
 * A representation of the entire project managed by Lerna.
 *
 * Wherever the lerna.json file is located, that is the project root.
 * All package globs are rooted from this location.
 */
class Project {
  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  static getPackages(cwd) {
    return new Project(cwd).getPackages();
  }

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  static getPackagesSync(cwd) {
    return new Project(cwd).getPackagesSync();
  }

  /**
   * @param {string} [cwd] Defaults to process.cwd()
   */
  constructor(cwd) {
    const explorer = cosmiconfigSync("lerna", {
      searchPlaces: ["lerna.json", "package.json"],
      transform(obj) {
        // cosmiconfig returns null when nothing is found
        if (!obj) {
          return {
            // No need to distinguish between missing and empty,
            // saves a lot of noisy guards elsewhere
            config: {},
            // path.resolve(".", ...) starts from process.cwd()
            filepath: path.resolve(cwd || ".", "lerna.json"),
          };
        }

        // rename deprecated durable config
        deprecateConfig(obj.config, obj.filepath);

        obj.config = applyExtends(obj.config, path.dirname(obj.filepath));

        return obj;
      },
    });

    let loaded;

    try {
      loaded = explorer.search(cwd);
    } catch (err) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }

      // re-throw other errors, could be ours or third-party
      throw err;
    }

    /** @type {ProjectConfig} */
    this.config = loaded.config;
    this.rootConfigLocation = loaded.filepath;
    this.rootPath = path.dirname(loaded.filepath);

    log.verbose("rootPath", this.rootPath);
  }

  get version() {
    return this.config.version;
  }

  set version(val) {
    this.config.version = val;
  }

  get packageConfigs() {
    if (this.config.useWorkspaces) {
      const workspaces = this.manifest.get("workspaces");

      if (!workspaces) {
        throw new ValidationError(
          "EWORKSPACES",
          dedent`
            Yarn workspaces need to be defined in the root package.json.
            See: https://github.com/lerna/lerna/blob/master/commands/bootstrap/README.md#--use-workspaces
          `
        );
      }

      return workspaces.packages || workspaces;
    }

    return this.config.packages || [Project.PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent).map((parentDir) => path.resolve(this.rootPath, parentDir));
  }

  get manifest() {
    let manifest;

    try {
      const manifestLocation = path.join(this.rootPath, "package.json");
      const packageJson = loadJsonFile.sync(manifestLocation);

      if (!packageJson.name) {
        // npm-lifecycle chokes if this is missing, so default like npm init does
        packageJson.name = path.basename(path.dirname(manifestLocation));
      }

      // Encapsulate raw JSON in Package instance
      manifest = new Package(packageJson, this.rootPath);

      // redefine getter to lazy-loaded value
      Object.defineProperty(this, "manifest", {
        value: manifest,
      });
    } catch (err) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }

      // try again next time
    }

    return manifest;
  }

  get licensePath() {
    let licensePath;

    try {
      const search = globby.sync(Project.LICENSE_GLOB, {
        cwd: this.rootPath,
        absolute: true,
        caseSensitiveMatch: false,
        // Project license is always a sibling of the root manifest
        deep: 0,
      });

      licensePath = search.shift();

      if (licensePath) {
        // POSIX results always need to be normalized
        licensePath = path.normalize(licensePath);

        // redefine getter to lazy-loaded value
        Object.defineProperty(this, "licensePath", {
          value: licensePath,
        });
      }
    } catch (err) {
      /* istanbul ignore next */
      throw new ValidationError(err.name, err.message);
    }

    return licensePath;
  }

  get fileFinder() {
    const finder = makeFileFinder(this.rootPath, this.packageConfigs);

    // redefine getter to lazy-loaded value
    Object.defineProperty(this, "fileFinder", {
      value: finder,
    });

    return finder;
  }

  /**
   * @returns {Promise<Package[]>} A promise resolving to a list of Package instances
   */
  getPackages() {
    const mapper = (packageConfigPath) =>
      loadJsonFile(packageConfigPath).then(
        (packageJson) => new Package(packageJson, path.dirname(packageConfigPath), this.rootPath)
      );

    return this.fileFinder("package.json", (filePaths) => pMap(filePaths, mapper, { concurrency: 50 }));
  }

  /**
   * @returns {Package[]} A list of Package instances
   */
  getPackagesSync() {
    return makeSyncFileFinder(this.rootPath, this.packageConfigs)("package.json", (packageConfigPath) => {
      return new Package(
        loadJsonFile.sync(packageConfigPath),
        path.dirname(packageConfigPath),
        this.rootPath
      );
    });
  }

  getPackageLicensePaths() {
    return this.fileFinder(Project.LICENSE_GLOB, null, { caseSensitiveMatch: false });
  }

  isIndependent() {
    return this.version === "independent";
  }

  serializeConfig() {
    // TODO: might be package.json prop
    return writeJsonFile(this.rootConfigLocation, this.config, { indent: 2, detectIndent: true }).then(
      () => this.rootConfigLocation
    );
  }
}

Project.PACKAGE_GLOB = "packages/*";
Project.LICENSE_GLOB = "LICEN{S,C}E{,.*}";

module.exports.Project = Project;
module.exports.getPackages = Project.getPackages;
module.exports.getPackagesSync = Project.getPackagesSync;
