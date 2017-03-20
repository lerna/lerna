import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import Command from "../Command";
import objectAssignSorted from "object-assign-sorted";

export default class InitCommand extends Command {
  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize(callback) {
    if (!GitUtilities.isInitialized()) {
      this.logger.info("Initializing Git repository.");
      GitUtilities.init();
    }

    callback(null, true);
  }

  execute(callback) {
    this.ensurePackageJSON();
    this.ensureLernaJson();
    this.ensureNoVersionFile();
    this.logger.success("Successfully created Lerna files");
    callback(null, true);
  }

  ensurePackageJSON() {
    let {packageJsonLocation, packageJson} = this.repository;

    if (!packageJson) {
      packageJson = {};
      this.logger.info("Creating package.json.");
    } else {
      this.logger.info("Updating package.json.");
    }

    let targetDependencies;
    if (packageJson.dependencies && packageJson.dependencies.lerna) {
      // lerna is a dependency in the current project
      targetDependencies = packageJson.dependencies;
    } else {
      // lerna is a devDependency or no dependency, yet
      if (!packageJson.devDependencies) packageJson.devDependencies = {};
      targetDependencies = packageJson.devDependencies;
    }

    const dependencyVersion = this.getOptions().exact
      ? this.lernaVersion
      : `^${this.lernaVersion}`;

    objectAssignSorted(targetDependencies, {
      lerna: dependencyVersion
    });

    FileSystemUtilities.writeFileSync(packageJsonLocation, JSON.stringify(packageJson, null, 2));
  }

  ensureLernaJson() {
    let {
      versionLocation,
      lernaJsonLocation,
      lernaJson,
      packageConfigs
    } = this.repository;

    let version;

    if (this.flags.independent) {
      version = "independent";
    } else if (FileSystemUtilities.existsSync(versionLocation)) {
      version = FileSystemUtilities.readFileSync(versionLocation);
    } else if (lernaJson.version) {
      version = lernaJson.version;
    } else {
      version = "0.0.0";
    }

    if (!FileSystemUtilities.existsSync(lernaJsonLocation)) {
      this.logger.info("Creating lerna.json.");
      // lernaJson already defaulted to empty object in Repository constructor
    } else {
      this.logger.info("Updating lerna.json.");
    }

    Object.assign(lernaJson, {
      lerna: this.lernaVersion,
      packages: packageConfigs,
      version: version
    });

    FileSystemUtilities.writeFileSync(lernaJsonLocation, JSON.stringify(lernaJson, null, 2));
  }

  ensureNoVersionFile() {
    const versionLocation = this.repository.versionLocation;
    if (FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("Removing old VERSION file.");
      FileSystemUtilities.unlinkSync(versionLocation);
    }
  }
}
