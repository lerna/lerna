import findUp from "find-up";
import globParent from "glob-parent";
import loadJsonFile from "load-json-file";
import log from "npmlog";
import path from "path";
import readPkg from "read-pkg";
import semver from "semver";

import dependencyIsSatisfied from "./utils/dependencyIsSatisfied";
import Package from "./Package";
import PackageUtilities from "./PackageUtilities";
import GitVersionParser from "./GitVersionParser";
import VersionSerializer from "./VersionSerializer";

const DEFAULT_PACKAGE_GLOB = "packages/*";

export default class Repository {
  constructor(cwd) {
    const lernaJsonLocation = (
      // findUp returns null when not found
      findUp.sync("lerna.json", { cwd }) ||

      // path.resolve(".", ...) starts from process.cwd()
      path.resolve((cwd || "."), "lerna.json")
    );

    this.rootPath = path.dirname(lernaJsonLocation);
    log.verbose("rootPath", this.rootPath);

    this.lernaJsonLocation = lernaJsonLocation;
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
  }

  get lernaJson() {
    if (!this._lernaJson) {
      try {
        this._lernaJson = loadJsonFile.sync(this.lernaJsonLocation);
      } catch (ex) {
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
      return this.packageJson.workspaces;
    }
    return this.lernaJson.packages || [DEFAULT_PACKAGE_GLOB];
  }

  get packageParentDirs() {
    return this.packageConfigs.map(globParent)
      .map(parentDir => path.resolve(this.rootPath, parentDir));
  }

  get packages() {
    if (!this._packages) {
      this.buildPackageGraph();
    }

    return this._packages;
  }

  get packageGraph() {
    if (!this._packageGraph) {
      this.buildPackageGraph();
    }

    return this._packageGraph;
  }

  get packageJson() {
    if (!this._packageJson) {
      try {
        this._packageJson = readPkg.sync(this.packageJsonLocation, { normalize: false });
      } catch (ex) {
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

  buildPackageGraph() {
    const packages = PackageUtilities.getPackages(this);
    const packageGraph = PackageUtilities.getPackageGraph(packages, false, this.lernaJson.useGitVersion
      ? new GitVersionParser(this.lernaJson.gitVersionPrefix)
      : null);

    if (this.lernaJson.useGitVersion) {
      packages.forEach((pkg) => {
        pkg.versionSerializer = new VersionSerializer({
          monorepoDependencies: packageGraph.get(pkg.name).dependencies,
          versionParser: new GitVersionParser(this.lernaJson.gitVersionPrefix)
        });
      });
    }

    this._packages = packages;
    this._packageGraph = packageGraph;
  }

  hasDependencyInstalled(depName, version) {
    log.silly("hasDependencyInstalled", "ROOT", depName, version);

    return dependencyIsSatisfied(
      this.nodeModulesLocation, depName, version
    );
  }
}
