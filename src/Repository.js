import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import path from "path";
import logger from "./logger";

export default class Repository {
  constructor() {
    if (!GitUtilities.isInitialized()) {
      logger.info("Initializing Git repository.");
      GitUtilities.init();
    }

    this.rootPath = GitUtilities.getTopLevelDirectory();
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

  get linkedFiles() {
    return this.lernaJson && this.lernaJson.linkedFiles || {};
  }

  get bootstrapConfig() {
    return this.lernaJson && this.lernaJson.bootstrapConfig || {};
  }

  isIndependent() {
    return this.version === "independent";
  }
}
