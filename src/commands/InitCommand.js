import _ from "lodash";
import writePkg from "write-pkg";
import writeJsonFile from "write-json-file";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import Command from "../Command";

export default class InitCommand extends Command {
  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize(callback) {
    if (!GitUtilities.isInitialized(this.repository.rootPath)) {
      this.logger.info("Initializing Git repository.");
      GitUtilities.init(this.repository.rootPath);
    }

    this.exact = this.getOptions().exact;

    callback(null, true);
  }

  execute(callback) {
    this.ensurePackageJSON();
    this.ensureLernaJson();
    this.ensureNoVersionFile();
    this.logger.success("Successfully initialized Lerna files");
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

    targetDependencies.lerna = this.exact
      ? this.lernaVersion
      : `^${this.lernaVersion}`;

    writePkg.sync(packageJsonLocation, packageJson);
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

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const configKey = lernaJson.commands ? "commands" : "command";
      _.set(lernaJson, `${configKey}.init.exact`, true);
    }

    writeJsonFile.sync(lernaJsonLocation, lernaJson, { indent: 2 });
  }

  ensureNoVersionFile() {
    const versionLocation = this.repository.versionLocation;
    if (FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("Removing old VERSION file.");
      FileSystemUtilities.unlinkSync(versionLocation);
    }
  }
}
