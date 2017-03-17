import path from "path";
import findUp from "find-up";
import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import loadJsonFile from "load-json-file";
import PackageUtilities from "./PackageUtilities";
import Package from "./Package";
import NpmUtilities from "./NpmUtilities";

const DEFAULT_PACKAGE_GLOB = "packages/*";

export default class Repository {
  constructor() {
    if (!GitUtilities.isInitialized()) {
      logger.info("Initializing Git repository.");
      GitUtilities.init();
    }

    // findUp returns null when not found, and path.resolve starts from process.cwd()
    const lernaJsonLocation = findUp.sync("lerna.json") || path.resolve("lerna.json");

    this.rootPath = path.dirname(lernaJsonLocation);
    this.lernaJsonLocation = lernaJsonLocation;
    this.packageJsonLocation = path.join(this.rootPath, "package.json");

    if (FileSystemUtilities.existsSync(this.lernaJsonLocation)) {
      this.lernaJson = loadJsonFile.sync(this.lernaJsonLocation);
    } else {
      // No need to distinguish between missing and empty.
      // This saves us a lot of guards.
      this.lernaJson = {};
    }

    if (FileSystemUtilities.existsSync(this.packageJsonLocation)) {
      this.packageJson = loadJsonFile.sync(this.packageJsonLocation);
    }

    this.package = new Package(this.packageJson, this.rootPath);
  }

  get lernaVersion() {
    return this.lernaJson && this.lernaJson.lerna;
  }

  get version() {
    return this.lernaJson && this.lernaJson.version;
  }

  get publishConfig() {
    return this.lernaJson && this.lernaJson.publishConfig || {};
  }

  get bootstrapConfig() {
    return this.lernaJson && this.lernaJson.bootstrapConfig || {};
  }

  get nodeModulesLocation() {
    return path.join(this.rootPath, "node_modules");
  }

  get packageConfigs() {
    return (this.lernaJson || {}).packages || [DEFAULT_PACKAGE_GLOB];
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

  // Legacy
  get versionLocation() {
    return path.join(this.rootPath, "VERSION");
  }

  isIndependent() {
    return this.version === "independent";
  }

  buildPackageGraph() {
    this._packages = PackageUtilities.getPackages(this);
    this._packageGraph = PackageUtilities.getPackageGraph(this._packages);
  }

  hasDependencyInstalled(dependency, version) {
    return NpmUtilities.dependencyIsSatisfied(
      this.nodeModulesLocation, dependency, version
    );
  }
}
