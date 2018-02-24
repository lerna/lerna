"use strict";

const async = require("async");
const dedent = require("dedent");
const getPort = require("get-port");
const path = require("path");

const Command = require("../Command");
const FileSystemUtilities = require("../FileSystemUtilities");
const npmInstall = require("../utils/npm-install");
const npmRunScript = require("../utils/npm-run-script");
const batchPackages = require("../utils/batch-packages");
const matchPackageName = require("../utils/match-package-name");
const hasDependencyInstalled = require("../utils/has-dependency-installed");
const runParallelBatches = require("../utils/run-parallel-batches");
const symlinkBinary = require("../utils/symlink-binary");
const symlinkDependencies = require("../utils/symlink-dependencies");
const ValidationError = require("../utils/validation-error");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new BootstrapCommand(argv);
};

exports.command = "bootstrap";

exports.describe = "Link local packages together and install remaining package dependencies";

exports.builder = yargs =>
  yargs
    .example(
      "$0 bootstrap -- --no-optional",
      "# execute `npm install --no-optional` in bootstrapped packages"
    )
    .options({
      hoist: {
        group: "Command Options:",
        describe: "Install external dependencies matching [glob] to the repo root",
        defaultDescription: "'**'",
        coerce: arg =>
          // `--hoist` is equivalent to `--hoist=**`.
          arg === true ? "**" : arg,
      },
      nohoist: {
        group: "Command Options:",
        describe: "Don't hoist external dependencies matching [glob] to the repo root",
        type: "string",
      },
      mutex: {
        hidden: true,
        // untyped and hidden on purpose
      },
      "ignore-scripts": {
        group: "Command Options:",
        describe: "Don't run lifecycle scripts in bootstrapped packages",
        type: "boolean",
        default: undefined,
      },
      "npm-client": {
        group: "Command Options:",
        describe: "Executable used to install dependencies (npm, yarn, pnpm, ...)",
        type: "string",
        requiresArg: true,
      },
      registry: {
        group: "Command Options:",
        describe: "Use the specified registry for all npm client operations.",
        type: "string",
        requiresArg: true,
      },
    });

class BootstrapCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    const { registry, rejectCycles, npmClient = "npm", npmClientArgs, mutex, hoist } = this.options;

    if (npmClient === "yarn" && typeof hoist === "string") {
      throw new ValidationError(
        "EWORKSPACES",
        dedent`
            --hoist is not supported with --npm-client=yarn, use yarn workspaces instead
            A guide is available at https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/
          `
      );
    }

    if (
      npmClient === "yarn" &&
      this.repository.packageJson.workspaces &&
      this.options.useWorkspaces !== true
    ) {
      throw new ValidationError(
        "EWORKSPACES",
        dedent`
            Yarn workspaces are configured in package.json, but not enabled in lerna.json!
            Please choose one: useWorkspaces = true in lerna.json, or remove package.json workspaces config
          `
      );
    }

    this.npmConfig = {
      registry,
      npmClient,
      npmClientArgs,
      mutex,
    };

    // lerna bootstrap ... -- <input>
    const doubleDashArgs = this.options["--"] || [];
    if (doubleDashArgs.length) {
      this.npmConfig.npmClientArgs = [...(npmClientArgs || []), ...doubleDashArgs];
    }

    this.batchedPackages = this.toposort
      ? batchPackages(this.filteredPackages, rejectCycles)
      : [this.filteredPackages];

    if (npmClient === "yarn" && !mutex) {
      return getPort({ port: 42424, host: "0.0.0.0" }).then(port => {
        this.npmConfig.mutex = `network:${port}`;
        this.logger.silly("npmConfig", this.npmConfig);
      });
    }

    this.validatePackageNames();

    this.logger.silly("npmConfig", this.npmConfig);
  }

  execute() {
    return new Promise((resolve, reject) => {
      this.bootstrapPackages(err => {
        if (err) {
          reject(err);
        } else {
          this.logger.success("", `Bootstrapped ${this.filteredPackages.length} packages`);
          resolve();
        }
      });
    });
  }

  /**
   * Bootstrap packages
   * @param {Function} callback
   */
  bootstrapPackages(callback) {
    this.logger.info("", `Bootstrapping ${this.filteredPackages.length} packages`);

    if (this.options.useWorkspaces) {
      this.installRootPackageOnly(callback);
    } else {
      const { ignoreScripts } = this.options;
      async.series(
        [
          // preinstall bootstrapped packages
          !ignoreScripts && (cb => this.preinstallPackages(cb)),
          // install external dependencies
          cb => this.installExternalDependencies(cb),
          // symlink packages and their binaries
          cb => this.symlinkPackages(cb),
          // postinstall bootstrapped packages
          !ignoreScripts && (cb => this.postinstallPackages(cb)),
          // prepublish bootstrapped packages
          !ignoreScripts && (cb => this.prepublishPackages(cb)),
          // prepare bootstrapped packages
          !ignoreScripts && (cb => this.preparePackages(cb)),
        ].filter(Boolean),
        callback
      );
    }
  }

  installRootPackageOnly(callback) {
    const tracker = this.logger.newItem("install dependencies");

    npmInstall(this.repository.rootPath, this.npmConfig)
      .then(() => {
        tracker.info("hoist", "Finished installing in root");
        tracker.completeWork(1);

        callback();
      })
      .catch(callback);
  }

  runScriptInPackages(scriptName, callback) {
    if (!this.filteredPackages.length) {
      return callback(null, true);
    }

    const packagesWithScript = new Set(this.filteredPackages.filter(pkg => pkg.scripts[scriptName]));

    if (!packagesWithScript.size) {
      return callback(null, true);
    }

    const { npmClient } = this.npmConfig;
    const tracker = this.logger.newItem(scriptName);
    tracker.addWork(packagesWithScript.size);

    runParallelBatches(
      this.batchedPackages,
      pkg => done => {
        if (!packagesWithScript.has(pkg)) {
          return done();
        }

        npmRunScript(scriptName, { args: [], npmClient, pkg }, err => {
          tracker.silly(pkg.name);
          tracker.completeWork(1);
          if (err) {
            err.pkg = pkg;
          }
          done(err);
        });
      },
      this.concurrency,
      err => {
        tracker.finish();
        callback(err);
      }
    );
  }

  /**
   * Run the "preinstall" NPM script in all bootstrapped packages
   * @param callback
   */
  preinstallPackages(callback) {
    this.logger.info("lifecycle", "preinstall");
    this.runScriptInPackages("preinstall", callback);
  }

  /**
   * Run the "postinstall" NPM script in all bootstrapped packages
   * @param callback
   */
  postinstallPackages(callback) {
    this.logger.info("lifecycle", "postinstall");
    this.runScriptInPackages("postinstall", callback);
  }

  /**
   * Run the "prepublish" NPM script in all bootstrapped packages
   * @param callback
   */
  prepublishPackages(callback) {
    this.logger.info("lifecycle", "prepublish");
    this.runScriptInPackages("prepublish", callback);
  }

  /**
   * Run the "prepare" NPM script in all bootstrapped packages
   * @param callback
   */
  preparePackages(callback) {
    this.logger.info("lifecycle", "prepare");
    this.runScriptInPackages("prepare", callback);
  }

  hoistedDirectory(dependency) {
    return path.join(this.repository.rootPath, "node_modules", dependency);
  }

  hoistedPackageJson(dependency) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return require(path.join(this.hoistedDirectory(dependency), "package.json"));
    } catch (e) {
      // Pass.
    }
  }

  /**
   * Return a object of root and leaf dependencies to install
   * @returns {Object}
   */
  getDependenciesToInstall(tracker) {
    // Configuration for what packages to hoist may be in lerna.json or it may
    // come in as command line options.
    const { hoist, nohoist } = this.options;
    const rootPkg = this.repository.package;

    if (hoist) {
      tracker.verbose("hoist", "enabled for %j", hoist);
    }

    // This will contain entries for each hoistable dependency.
    const rootSet = new Set();

    // This will map packages to lists of unhoistable dependencies
    const leaves = new Map();

    /**
     * Map of dependencies to install
     *
     * Map {
     *   "<externalName>": Map {
     *     "<versionRange>": Set { "<dependent1>", "<dependent2>", ... }
     *   }
     * }
     *
     * Example:
     *
     * Map {
     *   "react": Map {
     *     "15.x": Set { "my-component1", "my-component2", "my-component3" },
     *     "^0.14.0": Set { "my-component4" },
     *   }
     * }
     */
    const depsToInstall = new Map();
    const filteredNodes = new Map(
      this.filteredPackages.map(pkg => [pkg.name, this.packageGraph.get(pkg.name)])
    );

    // collect root dependency versions
    const mergedRootDeps = Object.assign({}, rootPkg.devDependencies, rootPkg.dependencies);
    const rootExternalVersions = new Map(
      Object.keys(mergedRootDeps).map(externalName => [externalName, mergedRootDeps[externalName]])
    );

    // seed the root dependencies
    rootExternalVersions.forEach((version, externalName) => {
      const externalDependents = new Set();
      const record = new Map();

      record.set(version, externalDependents);
      depsToInstall.set(externalName, record);
    });

    // build a map of external dependencies to install
    for (const [leafName, leafNode] of filteredNodes) {
      for (const [externalName, resolved] of leafNode.externalDependencies) {
        // rawSpec is something like "^1.2.3"
        const version = resolved.rawSpec;
        const record =
          depsToInstall.get(externalName) || depsToInstall.set(externalName, new Map()).get(externalName);
        const externalDependents = record.get(version) || record.set(version, new Set()).get(version);

        externalDependents.add(leafName);
      }
    }

    // determine where each dependency will be installed
    for (const [externalName, externalDependents] of depsToInstall) {
      let rootVersion;

      if (hoist && isHoistedPackage(externalName, hoist, nohoist)) {
        const commonVersion = Array.from(externalDependents.keys()).reduce(
          (a, b) => (externalDependents.get(a).size > externalDependents.get(b).size ? a : b)
        );

        // Get the version required by the repo root (if any).
        // If the root doesn't have a dependency on this package then we'll
        // install the most common dependency there.
        rootVersion = rootExternalVersions.get(externalName) || commonVersion;

        if (rootVersion !== commonVersion) {
          tracker.warn(
            "EHOIST_ROOT_VERSION",
            `The repository root depends on ${externalName}@${rootVersion}, ` +
              `which differs from the more common ${externalName}@${commonVersion}.`
          );
        }

        const dependents = Array.from(externalDependents.get(rootVersion)).map(
          leafName => this.packageGraph.get(leafName).pkg
        );

        // remove collection so leaves don't repeat it
        externalDependents.delete(rootVersion);

        // Install the best version we can in the repo root.
        // Even if it's already installed there we still need to make sure any
        // binaries are linked to the packages that depend on them.
        rootSet.add({
          name: externalName,
          dependents,
          dependency: `${externalName}@${rootVersion}`,
          isSatisfied: hasDependencyInstalled(rootPkg, externalName, rootVersion),
        });
      }

      // Add less common versions to package installs.
      for (const [leafVersion, leafDependents] of externalDependents) {
        for (const leafName of leafDependents) {
          if (rootVersion) {
            tracker.warn(
              "EHOIST_PKG_VERSION",
              `"${leafName}" package depends on ${externalName}@${leafVersion}, ` +
                `which differs from the hoisted ${externalName}@${rootVersion}.`
            );
          }

          const leafNode = this.packageGraph.get(leafName);
          const leafRecord = leaves.get(leafNode) || leaves.set(leafNode, new Set()).get(leafNode);

          // only install dependency if it's not already installed
          leafRecord.add({
            dependency: `${externalName}@${leafVersion}`,
            isSatisfied: hasDependencyInstalled(leafNode.pkg, externalName, leafVersion),
          });
        }
      }
    }

    tracker.silly("root dependencies", JSON.stringify(rootSet, null, 2));
    tracker.silly("leaf dependencies", JSON.stringify(leaves, null, 2));

    return { rootSet, leaves };
  }

  /**
   * Install external dependencies for all packages
   * @param {Function} callback
   */
  installExternalDependencies(callback) {
    const tracker = this.logger.newItem("install dependencies");

    const { leaves, rootSet } = this.getDependenciesToInstall(tracker);
    const rootPkg = this.repository.package;
    const actions = [];

    // Start root install first, if any, since it's likely to take the longest.
    if (rootSet.size) {
      // If we have anything to install in the root then we'll install
      // _everything_ that needs to go there.  This is important for
      // consistent behavior across npm clients.
      const root = Array.from(rootSet);
      const depsToInstallInRoot = root.some(({ isSatisfied }) => !isSatisfied)
        ? root.map(({ dependency }) => dependency)
        : [];

      actions.push(actionDone => {
        if (depsToInstallInRoot.length) {
          tracker.info("hoist", "Installing hoisted dependencies into root");
        }

        npmInstall.dependencies(rootPkg.location, depsToInstallInRoot, this.npmConfig, installError => {
          if (installError) {
            return actionDone(installError);
          }

          // Link binaries into dependent packages so npm scripts will have
          // access to them.
          async.series(
            root.map(({ name, dependents }) => itemDone => {
              const { bin } = this.hoistedPackageJson(name) || {};

              if (bin) {
                async.series(
                  dependents.map(pkg => linkDone => {
                    const src = this.hoistedDirectory(name);

                    symlinkBinary(src, pkg, linkDone);
                  }),
                  itemDone
                );
              } else {
                itemDone();
              }
            }),
            err => {
              tracker.info("hoist", "Finished installing in root");
              tracker.completeWork(1);
              actionDone(err);
            }
          );
        });
      });

      // Remove any hoisted dependencies that may have previously been
      // installed in package directories.
      actions.push(actionDone => {
        // Compute the list of candidate directories synchronously
        const candidates = root.filter(dep => dep.dependents.length).reduce((list, { name, dependents }) => {
          const dirs = dependents
            .filter(pkg => pkg.nodeModulesLocation !== rootPkg.nodeModulesLocation)
            .map(pkg => path.join(pkg.nodeModulesLocation, name));

          return list.concat(dirs);
        }, []);

        if (!candidates.length) {
          tracker.verbose("hoist", "nothing to prune");
          tracker.completeWork(1); // the action "work"
          return actionDone();
        }

        tracker.info("hoist", "Pruning hoisted dependencies");
        tracker.silly("prune", candidates);
        tracker.addWork(candidates.length);

        async.series(
          candidates.map(dirPath => done => {
            FileSystemUtilities.rimraf(dirPath, err => {
              tracker.verbose("prune", dirPath);
              tracker.completeWork(1);
              done(err);
            });
          }),
          err => {
            tracker.info("hoist", "Finished pruning hoisted dependencies");
            tracker.completeWork(1); // the action "work"
            actionDone(err);
          }
        );
      });
    }

    const leafNpmConfig = Object.assign({}, this.npmConfig, {
      // Use `npm install --global-style` for leaves when hoisting is enabled
      npmGlobalStyle: !!this.options.hoist,
    });

    // Install anything that needs to go into the leaves.
    leaves.forEach((leafRecord, leafNode) => {
      const deps = Array.from(leafRecord);

      // If we have any unsatisfied deps then we need to install everything.
      // This is important for consistent behavior across npm clients.
      if (deps.some(({ isSatisfied }) => !isSatisfied)) {
        actions.push(cb => {
          npmInstall.dependencies(
            leafNode.location,
            deps.map(({ dependency }) => dependency),
            leafNpmConfig,
            err => {
              tracker.verbose("installed leaf", leafNode.name);
              tracker.completeWork(1);
              cb(err);
            }
          );
        });
      }
    });

    if (actions.length) {
      tracker.info("", "Installing external dependencies");
      tracker.verbose("actions", "%d actions, concurrency %d", actions.length, this.concurrency);
      tracker.addWork(actions.length);
    }

    async.parallelLimit(actions, this.concurrency, err => {
      tracker.finish();
      callback(err);
    });
  }

  /**
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   * @param {Function} callback
   */
  symlinkPackages(callback) {
    return symlinkDependencies(this.filteredPackages, this.packageGraph, this.logger).then(
      callback,
      callback
    );
  }

  validatePackageNames() {
    const foundPackages = new Map();

    this.filteredPackages.forEach(({ name, location }) => {
      if (foundPackages.has(name)) {
        foundPackages.get(name).add(location);
      } else {
        foundPackages.set(name, new Set([location]));
      }
    });

    foundPackages.forEach((locationsFound, pkgName) => {
      if (locationsFound.size > 1) {
        throw new ValidationError(
          "ENAME",
          `Package name "${pkgName}" used in multiple packages:
          \t${Array.from(locationsFound).join("\n\t")}`
        );
      }
    });
  }
}

function isHoistedPackage(name, hoist, nohoist) {
  return matchPackageName(name, hoist) && matchPackageName(name, nohoist, true);
}
