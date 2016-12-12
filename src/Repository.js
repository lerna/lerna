// @flow

import GitUtilities from "./GitUtilities";
import FileSystemUtilities from "./FileSystemUtilities";
import path from "path";
import logger from "./logger";

export default class Repository {
  rootPath: string;
  lernaJsonLocation: string;
  packageJsonLocation: string;
  packagesLocation: string;
  versionLocation: string;

  lernaJson: Object;
  packageJson: Object;

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

  get lernaVersion(): ?string {
    return this.lernaJson && this.lernaJson.lerna;
  }

  get version(): ?string {
    return this.lernaJson && this.lernaJson.version;
  }

  get publishConfig(): Object {
    return this.lernaJson && this.lernaJson.publishConfig || {};
  }

  get linkedFiles(): Object {
    return this.lernaJson && this.lernaJson.linkedFiles || {};
  }

  get bootstrapConfig(): Object {
    return this.lernaJson && this.lernaJson.bootstrapConfig || {};
  }

  isIndependent(): boolean {
    return this.version === "independent";
  }
}
