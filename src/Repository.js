import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import PackageUtilities from "./PackageUtilities";
import path from "path";
import logger from "./logger";

export default class Repository {
  constructor() {
    if (!GitUtilities.isInitialized()) {
      logger.info("Initializing Git repository.");
      GitUtilities.init();
    }

    this.rootPath = path.resolve(GitUtilities.getTopLevelDirectory());
    this.lernaJsonLocation = path.join(this.rootPath, "lerna.json");
    this.packageJsonLocation = path.join(this.rootPath, "package.json");
    this.packagesLocation = path.join(this.rootPath, "packages");

    // Legacy
    this.versionLocation = path.join(this.rootPath, "VERSION");

    if (FileSystemUtilities.existsSync(this.lernaJsonLocation)) {
      this.lernaJson = JSON.parse(FileSystemUtilities.readFileSync(this.lernaJsonLocation));
    }

    if (FileSystemUtilities.existsSync(this.packageJsonLocation)) {
      this.packageJson = JSON.parse(FileSystemUtilities.readFileSync(this.packageJsonLocation));
    }
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
    this._packages = PackageUtilities.getPackages(this.packagesLocation);
    this._packageGraph = PackageUtilities.getPackageGraph(this._packages);
  }
}
