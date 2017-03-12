import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import PackageUtilities from "./PackageUtilities";
import Package from "./Package";
import NpmUtilities from "./NpmUtilities";
import path from "path";
import logger from "./logger";

const DEFAULT_PACKAGE_GLOB = "packages/*";

export default class Repository {
  constructor() {
    if (!GitUtilities.isInitialized()) {
      logger.info("Initializing Git repository.");
      GitUtilities.init();
    }

    this.rootPath = path.resolve(GitUtilities.getTopLevelDirectory());
    this.lernaJsonLocation = path.join(this.rootPath, "lerna.json");
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
    this.packagesLocation = path.join(this.rootPath, "packages"); // TODO: Kill this.

    // Legacy
    this.versionLocation = path.join(this.rootPath, "VERSION");

    if (FileSystemUtilities.existsSync(this.lernaJsonLocation)) {
      this.lernaJson = JSON.parse(FileSystemUtilities.readFileSync(this.lernaJsonLocation));
    } else {
      // No need to distinguish between missing and empty.
      // This saves us a lot of guards.
      this.lernaJson = {};
    }

    if (FileSystemUtilities.existsSync(this.packageJsonLocation)) {
      this.packageJson = JSON.parse(FileSystemUtilities.readFileSync(this.packageJsonLocation));
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

  get scripts() {
    return this.lernaJson && this.lernaJson.scripts || {};
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
