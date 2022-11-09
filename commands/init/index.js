"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");
const writeJsonFile = require("write-json-file");

const { Command } = require("@lerna/command");
const childProcess = require("@lerna/child-process");
const { Project } = require("@lerna/project");

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

    chain = chain.then(() => this.ensureGitIgnore());
    chain = chain.then(() => this.ensureConfig());
    chain = chain.then(() => this.ensurePackagesDir());

    return chain.then(() => {
      this.logger.success("", "Initialized Lerna files");
      this.logger.info("", "New to Lerna? Check out the docs: https://lerna.js.org/docs/getting-started");
    });
  }

  ensureGitIgnore() {
    const gitIgnorePath = path.join(this.project.rootPath, ".gitignore");

    let chain = Promise.resolve();

    if (!fs.existsSync(gitIgnorePath)) {
      this.logger.info("", "Creating .gitignore");
      chain = chain.then(() => fs.writeFile(gitIgnorePath, "node_modules/"));
    }

    return chain;
  }

  ensureConfig() {
    const hasExistingLernaConfig = !!this.project.version;
    const hasExistingPackageJson = !!this.project.manifest;

    const useNx = !hasExistingLernaConfig || this.project.config.useNx !== false;
    const useWorkspaces = !hasExistingLernaConfig || this.project.config.useWorkspaces === true;

    let chain = Promise.resolve();

    if (!hasExistingPackageJson) {
      this.logger.info("", "Creating package.json");

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      chain = chain.then(() => {
        const pkg = {
          name: "root",
          private: true,
        };

        if (useWorkspaces) {
          pkg.workspaces = [Project.PACKAGE_GLOB];
        }

        return writeJsonFile(path.join(this.project.rootPath, "package.json"), pkg, { indent: 2 });
      });
    } else {
      this.logger.info("", "Updating package.json");

      chain = chain.then(() => {
        if (useWorkspaces && !this.project.manifest.get("workspaces")) {
          this.project.manifest.set("workspaces", [Project.PACKAGE_GLOB]);

          return this.project.manifest.serialize();
        }
      });
    }

    // add dependencies to package.json
    chain = chain.then(() => {
      const rootPkg = this.project.manifest;

      const setDependency = ({ name, version }) => {
        let targetDependencies;

        if (rootPkg.dependencies && rootPkg.dependencies[name]) {
          targetDependencies = rootPkg.dependencies;
        } else {
          if (!rootPkg.devDependencies) {
            rootPkg.set("devDependencies", {});
          }

          targetDependencies = rootPkg.devDependencies;
        }

        targetDependencies[name] = this.exact ? version : `^${version}`;
      };

      setDependency({ name: "lerna", version: this.lernaVersion });

      return rootPkg.serialize();
    });

    chain = chain.then(() => {
      let version;

      if (this.options.independent) {
        version = "independent";
      } else if (this.project.version) {
        version = this.project.version;
      } else {
        version = "0.0.0";
      }

      if (!hasExistingLernaConfig) {
        this.logger.info("", "Creating lerna.json");
      } else {
        this.logger.info("", "Updating lerna.json");

        if (!useWorkspaces && !this.project.config.packages) {
          Object.assign(this.project.config, {
            packages: [Project.PACKAGE_GLOB],
          });
        }
      }

      delete this.project.config.lerna; // no longer relevant

      if (this.exact) {
        // ensure --exact is preserved for future init commands
        const commandConfig = this.project.config.command || (this.project.config.command = {});
        const initConfig = commandConfig.init || (commandConfig.init = {});

        initConfig.exact = true;
      }

      Object.assign(this.project.config, {
        $schema: "node_modules/lerna/schemas/lerna-schema.json",
        useWorkspaces,
        version,
        // Only set if explicitly disabling
        useNx: useNx === false ? false : undefined,
      });

      return this.project.serializeConfig();
    });

    return chain;
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");

    return pMap(this.project.packageParentDirs, (dir) => fs.mkdirp(dir));
  }
}

module.exports.InitCommand = InitCommand;
