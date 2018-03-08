"use strict";

const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");

const Command = require("@lerna/command");
const FileSystemUtilities = require("@lerna/fs-utils");
const GitUtilities = require("@lerna/git-utils");

class InitCommand extends Command {
  get defaultOptions() {
    return {
      exact: false,
      independent: false,
    };
  }

  get requiresGit() {
    return false;
  }

  // don't do any of this.
  runValidations() {}
  runPreparations() {}

  initialize() {
    this.exact = this.options.exact;

    if (!GitUtilities.isInitialized(this.execOpts)) {
      this.logger.info("", "Initializing Git repository");

      GitUtilities.init(this.execOpts);
    }
  }

  execute() {
    this.ensurePackageJSON();
    this.ensureLernaJson();
    this.ensurePackagesDir();
    this.logger.success("", "Initialized Lerna files");
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
    } else if (repositoryVersion) {
      version = repositoryVersion;
    } else {
      version = "0.0.0";
    }

    if (!this.repository.version) {
      this.logger.info("", "Creating lerna.json");
    } else {
      this.logger.info("", "Updating lerna.json");
    }

    Object.assign(lernaJson, {
      packages: this.repository.packageConfigs,
      version,
    });

    delete lernaJson.lerna; // no longer relevant

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const commandConfig = lernaJson.commands || lernaJson.command || (lernaJson.command = {});
      const initConfig = commandConfig.init || (commandConfig.init = {});

      initConfig.exact = true;
    }

    writeJsonFile.sync(this.repository.lernaJsonLocation, lernaJson, { indent: 2 });
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");
    this.repository.packageParentDirs.map(dir => FileSystemUtilities.mkdirpSync(dir));
  }
}

module.exports = InitCommand;
