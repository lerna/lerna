import _ from "lodash";
import async from "async";
import dedent from "dedent";
import getPort from "get-port";
import path from "path";
import semver from "semver";

import Command from "../Command";
import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import ValidationError from "../utils/ValidationError";

export function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  const cmd = new BootstrapCommand([...argv.args], argv, argv._cwd);
  return cmd.run().then(argv._onResolved, argv._onRejected);
}

export const command = "bootstrap [args..]";

export const describe = "Link local packages together and install remaining package dependencies";

export const builder = {
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
};

export default class BootstrapCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize(callback) {
    const { registry, rejectCycles, npmClient, npmClientArgs, mutex, hoist } = this.options;

    if (npmClient === "yarn" && typeof hoist === "string") {
      return callback(
        new ValidationError(
          "EWORKSPACES",
          dedent`
            --hoist is not supported with --npm-client=yarn, use yarn workspaces instead
            A guide is available at https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/
          `
        )
      );
    }

    if (
      npmClient === "yarn" &&
      this.repository.packageJson.workspaces &&
      this.options.useWorkspaces !== true
    ) {
      return callback(
        new ValidationError(
          "EWORKSPACES",
          dedent`
            Yarn workspaces are configured in package.json, but not enabled in lerna.json!
            Please choose one: useWorkspaces = true in lerna.json, or remove package.json workspaces config
          `
        )
      );
    }

    this.npmConfig = {
      registry,
      npmClient,
      npmClientArgs,
      mutex,
    };

    // lerna bootstrap ... -- <input>
    if (this.input.length) {
      this.npmConfig.npmClientArgs = [...(npmClientArgs || []), ...this.input];
    }

    try {
      this.batchedPackages = this.toposort
        ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, {
            rejectCycles,
          })
        : [this.filteredPackages];
    } catch (e) {
      return callback(e);
    }

    if (npmClient === "yarn" && !mutex) {
      return getPort({ port: 42424, host: "0.0.0.0" })
        .then(port => {
          this.npmConfig.mutex = `network:${port}`;
          this.logger.silly("npmConfig", this.npmConfig);
          callback(null, true);
        })
        .catch(callback);
    }

    PackageUtilities.validatePackageNames(this.filteredPackages);

    this.logger.silly("npmConfig", this.npmConfig);
    callback(null, true);
  }

  execute(callback) {
    this.bootstrapPackages(err => {
      if (err) {
        callback(err);
      } else {
        this.logger.success("", `Bootstrapped ${this.filteredPackages.length} packages`);
        callback(null, true);
      }
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

    NpmUtilities.installInDirOriginalPackageJson(this.repository.rootPath, this.npmConfig, err => {
      if (err) {
        return callback(err);
      }
      tracker.info("hoist", "Finished installing in root");
      tracker.completeWork(1);
      callback(err);
    });
  }

  runScriptInPackages(scriptName, callback) {
    if (!this.filteredPackages.length) {
      return callback(null, true);
    }

    const tracker = this.logger.newItem(scriptName);
    tracker.addWork(this.filteredPackages.length);

    PackageUtilities.runParallelBatches(
      this.batchedPackages,
      pkg => done => {
        pkg.runScript(scriptName, err => {
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
   * Determine if a dependency installed at the root satifies the requirements of the passed packages
   * This helps to optimize the bootstrap process and skip dependencies that are already installed
   * @param {String} dependency
   * @param {Array.<String>} packages
   */
  dependencySatisfiesPackages(dependency, packages) {
    const { version } = this.hoistedPackageJson(dependency) || {};
    return packages.every(pkg => semver.satisfies(version, pkg.allDependencies[dependency]));
  }

  /**
   * Return a object of root and leaf dependencies to install
   * @returns {Object}
   */
  getDependenciesToInstall(tracker) {
    // find package by name
    const findPackage = (name, version) =>
      _.find(this.packages, pkg => pkg.name === name && (!version || semver.satisfies(pkg.version, version)));

    const hasPackage = (name, version) => Boolean(findPackage(name, version));

    // Configuration for what packages to hoist may be in lerna.json or it may
    // come in as command line options.
    const { hoist, nohoist } = this.options;

    if (hoist) {
      tracker.verbose("hoist", "enabled for %j", hoist);
    }

    // This will contain entries for each hoistable dependency.
    const root = [];

    // This will map packages to lists of unhoistable dependencies
    const leaves = {};

    /**
     * Map of dependencies to install
     * {
     *   <name>: {
     *     versions: {
     *       <version>: <# of dependents>
     *     },
     *     dependents: {
     *       <version>: [<dependent1>, <dependent2>, ...]
     *     }
     *   }
     * }
     *
     * Example:
     *
     * {
     *   react: {
     *     versions: {
     *       "15.x": 3,
     *       "^0.14.0": 1
     *     },
     *     dependents: {
     *       "15.x": ["my-component1", "my-component2", "my-component3"],
     *       "^0.14.0": ["my-component4"],
     *     }
     *   }
     * }
     */
    const depsToInstall = {};

    Object.keys(this.repository.package.allDependencies).forEach(name => {
      const version = this.repository.package.allDependencies[name];
      depsToInstall[name] = {
        versions: { [version]: 0 },
        dependents: { [version]: [] },
      };
    });

    // get the map of external dependencies to install
    this.filteredPackages.forEach(pkg => {
      // for all package dependencies
      Object.keys(pkg.allDependencies)

        // map to package or normalized external dependency
        .map(
          name => findPackage(name, pkg.allDependencies[name]) || { name, version: pkg.allDependencies[name] }
        )

        // match external and version mismatched local packages
        .filter(dep => !hasPackage(dep.name, dep.version) || !pkg.hasMatchingDependency(dep, true))

        .forEach(({ name, version }) => {
          // Get the object for this package, auto-vivifying.
          const dep =
            depsToInstall[name] ||
            (depsToInstall[name] = {
              versions: {},
              dependents: {},
            });

          // Add this version if it's the first time we've seen it.
          if (!dep.versions[version]) {
            dep.versions[version] = 0;
            dep.dependents[version] = [];
          }

          // Record the dependency on this version.
          dep.versions[version] += 1;
          dep.dependents[version].push(pkg.name);
        });
    });

    // determine where each dependency will be installed
    Object.keys(depsToInstall).forEach(name => {
      const { versions, dependents } = depsToInstall[name];

      let rootVersion;

      if (hoist && PackageUtilities.isHoistedPackage(name, hoist, nohoist)) {
        // Get the most common version.
        const commonVersion = Object.keys(versions).reduce((a, b) => (versions[a] > versions[b] ? a : b));

        // Get the version required by the repo root (if any).
        // If the root doesn't have a dependency on this package then we'll
        // install the most common dependency there.
        rootVersion = this.repository.package.allDependencies[name] || commonVersion;

        if (rootVersion !== commonVersion) {
          tracker.warn(
            "EHOIST_ROOT_VERSION",
            `The repository root depends on ${name}@${rootVersion}, ` +
              `which differs from the more common ${name}@${commonVersion}.`
          );
        }

        // Install the best version we can in the repo root.
        // Even if it's already installed there we still need to make sure any
        // binaries are linked to the packages that depend on them.
        root.push({
          name,
          dependents: (dependents[rootVersion] || []).map(dep => this.packageGraph.get(dep).package),
          dependency: `${name}@${rootVersion}`,
          isSatisfied: this.repository.hasDependencyInstalled(name, rootVersion),
        });
      }

      // Add less common versions to package installs.
      Object.keys(versions).forEach(version => {
        // Only install deps that can't be hoisted in the leaves.
        if (version === rootVersion) {
          return;
        }

        dependents[version].forEach(pkg => {
          if (rootVersion) {
            tracker.warn(
              "EHOIST_PKG_VERSION",
              `"${pkg}" package depends on ${name}@${version}, ` +
                `which differs from the hoisted ${name}@${rootVersion}.`
            );
          }

          // only install dependency if it's not already installed
          (leaves[pkg] || (leaves[pkg] = [])).push({
            dependency: `${name}@${version}`,
            isSatisfied: findPackage(pkg).hasDependencyInstalled(name),
          });
        });
      });
    });

    tracker.silly("root dependencies", JSON.stringify(root, null, 2));
    tracker.silly("leaf dependencies", JSON.stringify(leaves, null, 2));

    return { root, leaves };
  }

  /**
   * Install external dependencies for all packages
   * @param {Function} callback
   */
  installExternalDependencies(callback) {
    const tracker = this.logger.newItem("install dependencies");

    const { leaves, root } = this.getDependenciesToInstall(tracker);
    const actions = [];

    // Start root install first, if any, since it's likely to take the longest.
    if (Object.keys(root).length) {
      // If we have anything to install in the root then we'll install
      // _everything_ that needs to go there.  This is important for
      // consistent behavior across npm clients.
      const depsToInstallInRoot = root.some(({ isSatisfied }) => !isSatisfied)
        ? root.map(({ dependency }) => dependency)
        : [];

      actions.push(actionDone => {
        if (depsToInstallInRoot.length) {
          tracker.info("hoist", "Installing hoisted dependencies into root");
        }

        NpmUtilities.installInDir(
          this.repository.rootPath,
          depsToInstallInRoot,
          this.npmConfig,
          installError => {
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
                      PackageUtilities.createBinaryLink(src, pkg, linkDone);
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
          }
        );
      });

      // Remove any hoisted dependencies that may have previously been
      // installed in package directories.
      actions.push(actionDone => {
        // Compute the list of candidate directories synchronously
        const candidates = root.filter(pkg => pkg.dependents.length).reduce((list, { name, dependents }) => {
          const dirs = dependents
            .filter(pkg => pkg.nodeModulesLocation !== this.repository.nodeModulesLocation)
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
    Object.keys(leaves)
      .map(pkgName => ({ pkg: this.packageGraph.get(pkgName).package, deps: leaves[pkgName] }))
      .forEach(({ pkg, deps }) => {
        // If we have any unsatisfied deps then we need to install everything.
        // This is important for consistent behavior across npm clients.
        if (deps.some(({ isSatisfied }) => !isSatisfied)) {
          actions.push(cb => {
            NpmUtilities.installInDir(
              pkg.location,
              deps.map(({ dependency }) => dependency),
              leafNpmConfig,
              err => {
                tracker.verbose("installed leaf", pkg.name);
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
    const forceLocal = false;
    const { filteredPackages, packageGraph, logger } = this;
    PackageUtilities.symlinkPackages(filteredPackages, packageGraph, logger, forceLocal, callback);
  }
}
