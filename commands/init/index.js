"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");
const writeJsonFile = require("write-json-file");

const { Command } = require("@lerna/command");
const childProcess = require("@lerna/child-process");

module.exports = factory;

function factory(argv) {
  return new InitCommand(argv);
}

class InitCommand extends Command {
  get requiresGit() {
    return false;
  }

  runValidations() {
    this.logger.verbose(this.name, "skipping validations");
  }

  runPreparations() {
    this.logger.verbose(this.name, "skipping preparations");
  }

  initialize() {
    this.exact = this.options.exact;
    this.lernaVersion = this.options.lernaVersion;

    if (!this.gitInitialized()) {
      this.logger.info("", "Initializing Git repository");

      return childProcess.exec("git", ["init"], this.execOpts);
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
    let chain = Promise.resolve();

    if (!this.project.manifest) {
      this.logger.info("", "Creating package.json");

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      chain = chain.then(() =>
        writeJsonFile(
          path.join(this.project.rootPath, "package.json"),
          {
            name: "root",
            private: true,
          },
          { indent: 2 }
        )
      );
    } else {
      this.logger.info("", "Updating package.json");
    }

    chain = chain.then(() => {
      const rootPkg = this.project.manifest;

      let targetDependencies;

      if (rootPkg.dependencies && rootPkg.dependencies.lerna) {
        // lerna is a dependency in the current project
        targetDependencies = rootPkg.dependencies;
      } else {
        // lerna is a devDependency or no dependency, yet
        if (!rootPkg.devDependencies) {
          // mutate raw JSON object
          rootPkg.set("devDependencies", {});
        }

        targetDependencies = rootPkg.devDependencies;
      }

      targetDependencies.lerna = this.exact ? this.lernaVersion : `^${this.lernaVersion}`;

      return rootPkg.serialize();
    });

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
      useNx: false,
      version,
    });

    return this.project.serializeConfig();
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");

    return pMap(this.project.packageParentDirs, (dir) => fs.mkdirp(dir));
  }
}

module.exports.InitCommand = InitCommand;
