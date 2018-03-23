"use strict";

const fs = require("fs-extra");
const pMap = require("p-map");
const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");

const Command = require("@lerna/command");
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
    let chain = Promise.resolve();

    chain = chain.then(() => this.ensurePackageJSON());
    chain = chain.then(() => this.ensureLernaConfig());
    chain = chain.then(() => this.ensurePackagesDir());

    return chain.then(() => {
      this.logger.success("", "Initialized Lerna files");
    });
  }

  ensurePackageJSON() {
    let { packageJson } = this.project;
    let chain = Promise.resolve();

    if (!packageJson) {
      packageJson = {
        name: "root",
        private: true,
      };
      this.logger.info("", "Creating package.json");

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      chain = chain.then(() => writeJsonFile(this.project.packageJsonLocation, packageJson, { indent: 2 }));
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

    chain = chain.then(() => writePkg(this.project.packageJsonLocation, packageJson));

    return chain;
  }

  ensureLernaConfig() {
    // config already defaulted to empty object in Project constructor
    const { config, version: projectVersion } = this.project;

    let version;

    if (this.options.independent) {
      version = "independent";
    } else if (projectVersion) {
      version = projectVersion;
    } else {
      version = "0.0.0";
    }

    if (!projectVersion) {
      this.logger.info("", "Creating lerna.json");
    } else {
      this.logger.info("", "Updating lerna.json");
    }

    delete config.lerna; // no longer relevant

    if (this.exact) {
      // ensure --exact is preserved for future init commands
      const commandConfig = config.command || (config.command = {});
      const initConfig = commandConfig.init || (commandConfig.init = {});

      initConfig.exact = true;
    }

    Object.assign(config, {
      packages: this.project.packageConfigs,
      version,
    });

    return this.project.serializeConfig();
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");

    return pMap(this.project.packageParentDirs, dir => fs.mkdirp(dir));
  }
}

module.exports = InitCommand;
