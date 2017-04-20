import _ from "lodash";
import writeJsonFile from "write-json-file";
import writePkg from "write-pkg";

import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";

export function handler(argv) {
  return new InitCommand(argv._, argv).run();
}

export const command = "init";

export const describe = "Create a new Lerna repo or upgrade an existing repo to the current version "
                      + "of Lerna.";

export const builder = {
  "exact": {
    describe: "Specify lerna dependency version in package.json without a caret (^)"
  },
  "independent": {
    describe: "Version packages independently",
    alias: "i"
  }
};

export default class InitCommand extends Command {
  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize(callback) {
    if (!GitUtilities.isInitialized(this.execOpts)) {
      this.logger.info("Initializing Git repository.");
      GitUtilities.init(this.execOpts);
    }

    this.exact = this.options.exact;

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
    let packageJson = this.repository.packageJson;

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

    writePkg.sync(this.repository.packageJsonLocation, packageJson);
  }

  ensureLernaJson() {
    // lernaJson already defaulted to empty object in Repository constructor
    const lernaJson = this.repository.lernaJson;

    let version;

    if (this.options.independent) {
      version = "independent";
    } else if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      version = FileSystemUtilities.readFileSync(this.repository.versionLocation);
    } else if (this.repository.version) {
      version = this.repository.version;
    } else {
      version = "0.0.0";
    }

    if (!this.repository.initVersion) {
      this.logger.info("Creating lerna.json.");
    } else {
      this.logger.info("Updating lerna.json.");
    }

    Object.assign(lernaJson, {
      lerna: this.lernaVersion,
      packages: this.repository.packageConfigs,
      version: version
    });

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const configKey = lernaJson.commands ? "commands" : "command";
      _.set(lernaJson, `${configKey}.init.exact`, true);
    }

    writeJsonFile.sync(this.repository.lernaJsonLocation, lernaJson, { indent: 2 });
  }

  ensureNoVersionFile() {
    const versionLocation = this.repository.versionLocation;
    if (FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("Removing old VERSION file.");
      FileSystemUtilities.unlinkSync(versionLocation);
    }
  }
}
