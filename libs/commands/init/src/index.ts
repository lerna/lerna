import { Command, CommandConfigOptions, Package, Project } from "@lerna/core";
import { writeJsonFile } from "@nrwl/devkit";
import fs from "fs-extra";
import pMap from "p-map";
import path from "path";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new InitCommand(argv);
};

interface InitCommandOptions extends CommandConfigOptions {
  exact: boolean;
  lernaVersion: string;
}

class InitCommand extends Command<InitCommandOptions> {
  exact?: boolean;
  lernaVersion = "";

  get requiresGit() {
    return false;
  }

  runValidations() {
    this.logger.verbose(this.name, "skipping validations");
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  runPreparations() {
    this.logger.verbose(this.name, "skipping preparations");
  }

  override initialize() {
    this.exact = this.options.exact;
    this.lernaVersion = this.options.lernaVersion;

    if (!this.gitInitialized()) {
      this.logger.info("", "Initializing Git repository");

      return childProcess.exec("git", ["init"], this.execOpts);
    }
  }

  override execute() {
    let chain: Promise<void | Package | void[]> = Promise.resolve();

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

    let chain: Promise<void | Package> = Promise.resolve();

    if (!hasExistingPackageJson) {
      this.logger.info("", "Creating package.json");

      // initialize with default indentation so write-pkg doesn't screw it up with tabs
      chain = chain.then(() => {
        const pkg = {
          name: "root",
          private: true,
        };

        if (useWorkspaces) {
          // TODO: refactor based on TS feedback
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          pkg.workspaces = [Project.PACKAGE_GLOB];
        }

        return writeJsonFile(path.join(this.project.rootPath, "package.json"), pkg, {
          spaces: 2,
        });
      });
    } else {
      this.logger.info("", "Updating package.json");

      chain = chain.then(() => {
        if (useWorkspaces && !this.project.manifest?.get("workspaces")) {
          this.project.manifest?.set("workspaces", [Project.PACKAGE_GLOB]);

          return this.project.manifest?.serialize();
        }
      });
    }

    // add dependencies to package.json
    chain = chain.then(() => {
      const rootPkg = this.project.manifest;

      const setDependency = ({ name, version }: { name: string; version: string }) => {
        let targetDependencies;

        if (rootPkg?.dependencies && rootPkg.dependencies[name]) {
          targetDependencies = rootPkg.dependencies;
        } else {
          if (!rootPkg?.devDependencies) {
            rootPkg?.set("devDependencies", {});
          }

          targetDependencies = rootPkg?.devDependencies;
        }
        if (targetDependencies) {
          targetDependencies[name] = this.exact ? version : `^${version}`;
        }
      };

      setDependency({ name: "lerna", version: this.lernaVersion });

      return rootPkg?.serialize();
    });

    // TODO: refactor based on TS feedback
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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

      // TODO: refactor based on TS feedback
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete this.project.config.lerna; // no longer relevant

      if (this.exact) {
        // ensure --exact is preserved for future init commands
        const commandConfig = this.project.config.command || (this.project.config.command = {});
        const initConfig = commandConfig.init || (commandConfig.init = {});

        // TODO: refactor based on TS feedback
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        initConfig.exact = true;
      }

      Object.assign(this.project.config, {
        $schema: "node_modules/lerna/schemas/lerna-schema.json",
        useWorkspaces,
        version,
        // Only set if explicitly disabling
        useNx: useNx === false ? false : undefined,
      });

      return Promise.resolve(this.project.serializeConfig());
    });

    return chain;
  }

  ensurePackagesDir() {
    this.logger.info("", "Creating packages directory");
    return pMap(this.project.packageParentDirs, (dir: string) => fs.mkdirp(dir));
  }
}

module.exports.InitCommand = InitCommand;
