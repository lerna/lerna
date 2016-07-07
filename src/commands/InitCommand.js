// @flow

import FileSystemUtilities from "../FileSystemUtilities";
import Command from "../Command";
import objectAssignSorted from "object-assign-sorted";
import objectAssign from "object-assign";

export default class InitCommand extends Command {
  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize(callback: Function) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback: Function) {
    this.ensurePackagesDirectory();
    this.ensurePackageJSON();
    this.ensureLernaJson();
    this.ensureNoVersionFile();
    this.logger.success("Successfully created Lerna files");
    callback(null, true);
  }

  ensurePackagesDirectory() {
    const packagesLocation = this.repository.packagesLocation;
    if (!FileSystemUtilities.existsSync(packagesLocation)) {
      this.logger.info("Creating packages folder.");
      FileSystemUtilities.mkdirSync(packagesLocation);
    }
  }

  ensurePackageJSON() {
    let {packageJsonLocation, packageJson} = this.repository;

    if (!packageJson) {
      packageJson = {};
      this.logger.info("Creating package.json.");
    } else {
      this.logger.info("Updating package.json.");
    }
    // if (!packageJson.private) packageJson.private = true;

    let targetDependencies;
    if (packageJson.dependencies && packageJson.dependencies.lerna) {
      // lerna is a dependency in the current project
      targetDependencies = packageJson.dependencies;
    } else {
      // lerna is a devDependency or no dependency, yet
      if (!packageJson.devDependencies) packageJson.devDependencies = {};
      targetDependencies = packageJson.devDependencies;
    }

    objectAssignSorted(targetDependencies, {
      lerna: this.lernaVersion
    });

    FileSystemUtilities.writeFileSync(packageJsonLocation, JSON.stringify(packageJson, null, "  "));
  }

  ensureLernaJson() {
    let {versionLocation, lernaJsonLocation, lernaJson} = this.repository;

    let version;

    if (this.flags.independent) {
      version = "independent";
    } else if (FileSystemUtilities.existsSync(versionLocation)) {
      version = FileSystemUtilities.readFileSync(versionLocation);
    } else if (lernaJson && lernaJson.version) {
      version = lernaJson.version;
    } else {
      version = "0.0.0";
    }

    if (!lernaJson) {
      this.logger.info("Creating lerna.json.");
      lernaJson = {};
    } else {
      this.logger.info("Updating lerna.json.");
    }

    objectAssign(lernaJson, {
      lerna: this.lernaVersion,
      version: version
    });

    FileSystemUtilities.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, "  "));
  }

  ensureNoVersionFile() {
    const versionLocation = this.repository.versionLocation;
    if (FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("Removing old VERSION file.");
      FileSystemUtilities.unlinkSync(versionLocation);
    }
  }
}
