import _ from "lodash";
import writeJsonFile from "write-json-file";
import writePkg from "write-pkg";

import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new InitCommand(argv._, argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "init";

export const describe =
  "Create a new Lerna repo or upgrade an existing repo to the current version of Lerna.";

export const builder = {
  exact: {
    describe: "Specify lerna dependency version in package.json without a caret (^)",
    type: "boolean",
    default: undefined,
  },
  independent: {
    describe: "Version packages independently",
    alias: "i",
    type: "boolean",
    default: undefined,
  },
};

export default class InitCommand extends Command {
  get defaultOptions() {
    return {
      exact: false,
      independent: false,
    };
  }

  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize(callback) {
    if (!GitUtilities.isInitialized(this.execOpts)) {
      this.logger.info("", "Initializing Git repository");
      GitUtilities.init(this.execOpts);
    }

    this.exact = this.options.exact;

    callback(null, true);
  }

  execute(callback) {
    this.ensurePackageJSON();
    this.ensureLernaJson();
    this.ensurePackagesDir();
    this.ensureNoVersionFile();
    this.logger.success("", "Initialized Lerna files");
    callback(null, true);
  }

  ensurePackageJSON() {
    let { packageJson } = this.repository;

    if (!packageJson) {
      packageJson = {};
      this.logger.info("", "Creating package.json");
    } else {
      this.logger.info("", "Updating package.json");
    }

    let targetDependencies;
    if (packageJson.dependencies && packageJson.dependencies.lerna) {
      // lerna is a dependency in the current project
      targetDependencies = packageJson.dependencies;
    } else {
      // lerna is a devDependency or no dependency, yet
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      targetDependencies = packageJson.devDependencies;
    }

    targetDependencies.lerna = this.exact ? this.lernaVersion : `^${this.lernaVersion}`;

    writePkg.sync(this.repository.packageJsonLocation, packageJson);
  }

  ensureLernaJson() {
    // lernaJson already defaulted to empty object in Repository constructor
    const { lernaJson, version: repositoryVersion } = this.repository;

    let version;

    if (this.options.independent) {
      version = "independent";
    } else if (FileSystemUtilities.existsSync(this.repository.versionLocation)) {
      version = FileSystemUtilities.readFileSync(this.repository.versionLocation);
    } else if (repositoryVersion) {
      version = repositoryVersion;
    } else {
      version = "0.0.0";
    }

    if (!this.repository.initVersion) {
      this.logger.info("", "Creating lerna.json");
    } else {
      this.logger.info("", "Updating lerna.json");
    }

    Object.assign(lernaJson, {
      lerna: this.lernaVersion,
      packages: this.repository.packageConfigs,
      version,
    });

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const configKey = lernaJson.commands ? "commands" : "command";
      _.set(lernaJson, `${configKey}.init.exact`, true);
    }

    writeJsonFile.sync(this.repository.lernaJsonLocation, lernaJson, { indent: 2 });
  }

  ensureNoVersionFile() {
    const { versionLocation } = this.repository;
    if (FileSystemUtilities.existsSync(versionLocation)) {
      this.logger.info("", "Removing old VERSION file");
      FileSystemUtilities.unlinkSync(versionLocation);
    }
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");
    this.repository.packageParentDirs.map(dir => FileSystemUtilities.mkdirpSync(dir));
  }
}
