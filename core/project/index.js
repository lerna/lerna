"use strict";

const cosmiconfig = require("cosmiconfig");
const dedent = require("dedent");
const globby = require("globby");
const globParent = require("glob-parent");
const loadJsonFile = require("load-json-file");
const log = require("npmlog");
const pMap = require("p-map");
const path = require("path");
const writeJsonFile = require("write-json-file");

const ValidationError = require("@lerna/validation-error");
const Package = require("@lerna/package");
const applyExtends = require("./lib/apply-extends");
const deprecateConfig = require("./lib/deprecate-config");
const makeFileFinder = require("./lib/make-file-finder");

class Project {
  constructor(cwd) {
    const explorer = cosmiconfig("lerna", {
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
      loaded = explorer.searchSync(cwd);
    } catch (err) {
      // redecorate JSON syntax errors, avoid debug dump
      if (err.name === "JSONError") {
        throw new ValidationError(err.name, err.message);
      }

      // re-throw other errors, could be ours or third-party
      throw err;
    }

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
    return this.packageConfigs.map(globParent).map(parentDir => path.resolve(this.rootPath, parentDir));
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
        case: false,
        // Project license is always a sibling of the root manifest
        deep: false,
        // POSIX results always need to be normalized
        transform: fp => path.normalize(fp),
      });

      licensePath = search.shift();

      if (licensePath) {
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

  getPackages() {
    const mapper = packageConfigPath =>
      loadJsonFile(packageConfigPath).then(
        packageJson => new Package(packageJson, path.dirname(packageConfigPath), this.rootPath)
      );

    return this.fileFinder("package.json", filePaths => pMap(filePaths, mapper, { concurrency: 50 }));
  }

  getPackageLicensePaths() {
    return this.fileFinder(Project.LICENSE_GLOB, null, { case: false });
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

module.exports = Project;
module.exports.getPackages = cwd => new Project(cwd).getPackages();
