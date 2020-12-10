"use strict";

const dedent = require("dedent");
const getPort = require("get-port");
const npa = require("npm-package-arg");
const path = require("path");
const pMap = require("p-map");
const pMapSeries = require("p-map-series");
const pWaterfall = require("p-waterfall");

const { Command } = require("@lerna/command");
const { rimrafDir } = require("@lerna/rimraf-dir");
const { hasNpmVersion } = require("@lerna/has-npm-version");
const { npmInstall, npmInstallDependencies } = require("@lerna/npm-install");
const { createRunner } = require("@lerna/run-lifecycle");
const { runTopologically } = require("@lerna/run-topologically");
const { symlinkBinary } = require("@lerna/symlink-binary");
const { symlinkDependencies } = require("@lerna/symlink-dependencies");
const { ValidationError } = require("@lerna/validation-error");
const { getFilteredPackages } = require("@lerna/filter-options");
const { PackageGraph } = require("@lerna/package-graph");
const { pulseTillDone } = require("@lerna/pulse-till-done");

const { hasDependencyInstalled } = require("./lib/has-dependency-installed");
const { isHoistedPackage } = require("./lib/is-hoisted-package");

module.exports = factory;

function factory(argv) {
  return new BootstrapCommand(argv);
}

class BootstrapCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    const { registry, npmClient = "npm", npmClientArgs = [], mutex, hoist, nohoist } = this.options;

    if (npmClient === "yarn" && hoist) {
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
      this.project.manifest.get("workspaces") &&
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

    // postinstall and prepare are commonly used to call `lerna bootstrap`,
    // but we need to avoid recursive execution when `--hoist` is enabled
    const { LERNA_EXEC_PATH = "leaf", LERNA_ROOT_PATH = "root" } = process.env;

    if (LERNA_EXEC_PATH === LERNA_ROOT_PATH) {
      this.logger.warn("bootstrap", "Skipping recursive execution");

      return false;
    }

    if (hoist) {
      let hoisting;

      if (hoist === true) {
        // lerna.json `hoist: true`
        hoisting = ["**"];
      } else {
        // `--hoist ...` or lerna.json `hoist: [...]`
        hoisting = [].concat(hoist);
      }

      if (nohoist) {
        if (!Array.isArray(nohoist)) {
          // `--nohoist` single
          hoisting = hoisting.concat(`!${nohoist}`);
        } else {
          // `--nohoist` multiple or lerna.json `nohoist: [...]`
          hoisting = hoisting.concat(nohoist.map((str) => `!${str}`));
        }
      }

      this.logger.verbose("hoist", "using globs %j", hoisting);
      this.hoisting = hoisting;
    }

    this.runPackageLifecycle = createRunner({ registry });
    this.npmConfig = {
      registry,
      npmClient,
      npmClientArgs,
      mutex,
    };

    if (npmClient === "npm" && this.options.ci && hasNpmVersion(">=5.7.0")) {
      // never `npm ci` when hoisting
      this.npmConfig.subCommand = this.hoisting ? "install" : "ci";

      if (this.hoisting) {
        // don't mutate lockfiles in CI
        this.npmConfig.npmClientArgs.unshift("--no-save");
      }
    }

    // lerna bootstrap ... -- <input>
    const doubleDashArgs = this.options["--"] || [];
    if (doubleDashArgs.length) {
      this.npmConfig.npmClientArgs = [...npmClientArgs, ...doubleDashArgs];
    }

    // do not run any lifecycle scripts (if configured)
    if (this.options.ignoreScripts) {
      this.npmConfig.npmClientArgs.unshift("--ignore-scripts");
    }

    this.targetGraph = this.options.forceLocal
      ? new PackageGraph(this.packageGraph.rawPackageList, "allDependencies", "forceLocal")
      : this.packageGraph;

    let chain = Promise.resolve();

    chain = chain.then(() => {
      return getFilteredPackages(this.targetGraph, this.execOpts, this.options);
    });

    chain = chain.then((filteredPackages) => {
      this.filteredPackages = filteredPackages;

      if (this.options.contents) {
        // globally override directory to link
        for (const pkg of filteredPackages) {
          pkg.contents = this.options.contents;
        }
      }

      if (filteredPackages.length !== this.targetGraph.size && !this.options.forceLocal) {
        this.logger.warn("bootstrap", "Installing local packages that do not match filters from registry");

        // an explicit --scope, --ignore, or --since should only symlink the targeted packages, no others
        this.targetGraph = new PackageGraph(filteredPackages, "allDependencies", this.options.forceLocal);

        // never automatically --save or modify lockfiles
        this.npmConfig.npmClientArgs.unshift(npmClient === "yarn" ? "--pure-lockfile" : "--no-save");

        // never attempt `npm ci`, it would always fail
        if (this.npmConfig.subCommand === "ci") {
          this.npmConfig.subCommand = "install";
        }
      }
    });

    chain = chain.then(() => {
      if (npmClient === "yarn" && !mutex) {
        return getPort({ port: 42424, host: "0.0.0.0" }).then((port) => {
          this.npmConfig.mutex = `network:${port}`;
          this.logger.silly("npmConfig", this.npmConfig);
        });
      }

      this.logger.silly("npmConfig", this.npmConfig);
    });

    return chain;
  }

  execute() {
    if (this.options.useWorkspaces || this.rootHasLocalFileDependencies()) {
      return this.installRootPackageOnly();
    }

    const filteredLength = this.filteredPackages.length;
    const packageCountLabel = `${filteredLength} package${filteredLength > 1 ? "s" : ""}`;
    const scriptsEnabled = this.options.ignoreScripts !== true;

    // root install does not need progress bar
    this.enableProgressBar();
    this.logger.info("", `Bootstrapping ${packageCountLabel}`);

    // conditional task queue
    const tasks = [];

    if (scriptsEnabled) {
      tasks.push(() => this.runLifecycleInPackages("preinstall"));
    }

    tasks.push(
      () => this.getDependenciesToInstall(),
      (result) => this.installExternalDependencies(result),
      () => this.symlinkPackages()
    );

    if (scriptsEnabled) {
      tasks.push(
        () => this.runLifecycleInPackages("install"),
        () => this.runLifecycleInPackages("postinstall")
      );

      if (!this.options.ignorePrepublish) {
        tasks.push(() => this.runLifecycleInPackages("prepublish"));
      }

      // "run on local npm install without any arguments", AFTER prepublish
      tasks.push(() => this.runLifecycleInPackages("prepare"));
    }

    return pWaterfall(tasks).then(() => {
      this.logger.success("", `Bootstrapped ${packageCountLabel}`);
    });
  }

  installRootPackageOnly() {
    this.logger.info("bootstrap", "root only");

    // don't hide yarn or npm output
    this.npmConfig.stdio = "inherit";

    return npmInstall(this.project.manifest, this.npmConfig);
  }

  /**
   * If the root manifest has local dependencies with `file:` specifiers,
   * all the complicated bootstrap logic should be skipped in favor of
   * npm5's package-locked auto-hoisting.
   * @returns {Boolean}
   */
  rootHasLocalFileDependencies() {
    const rootDependencies = Object.assign({}, this.project.manifest.dependencies);

    return Object.keys(rootDependencies).some(
      (name) =>
        this.targetGraph.has(name) &&
        npa.resolve(name, rootDependencies[name], this.project.rootPath).type === "directory"
    );
  }

  runLifecycleInPackages(stage) {
    this.logger.verbose("lifecycle", stage);

    if (!this.filteredPackages.length) {
      return;
    }

    const tracker = this.logger.newItem(stage);

    const mapPackageWithScript = (pkg) =>
      this.runPackageLifecycle(pkg, stage).then(() => {
        tracker.completeWork(1);
      });

    tracker.addWork(this.filteredPackages.length);

    const runner = this.toposort
      ? runTopologically(this.filteredPackages, mapPackageWithScript, {
          concurrency: this.concurrency,
          rejectCycles: this.options.rejectCycles,
        })
      : pMap(this.filteredPackages, mapPackageWithScript, { concurrency: this.concurrency });

    return runner.finally(() => tracker.finish());
  }

  hoistedDirectory(dependency) {
    return path.join(this.project.rootPath, "node_modules", dependency);
  }

  hoistedPackageJson(dependency) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      return require(path.join(this.hoistedDirectory(dependency), "package.json"));
    } catch (e) {
      // Pass.
      return {};
    }
  }

  /**
   * Return a object of root and leaf dependencies to install
   * @returns {Object}
   */
  getDependenciesToInstall() {
    // Configuration for what packages to hoist may be in lerna.json or it may
    // come in as command line options.
    const rootPkg = this.project.manifest;

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
      this.filteredPackages.map((pkg) => [pkg.name, this.targetGraph.get(pkg.name)])
    );

    // collect root dependency versions
    const mergedRootDeps = Object.assign(
      {},
      rootPkg.devDependencies,
      rootPkg.optionalDependencies,
      rootPkg.dependencies
    );
    const rootExternalVersions = new Map(
      Object.keys(mergedRootDeps).map((externalName) => [externalName, mergedRootDeps[externalName]])
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

    const rootActions = [];
    const leafActions = [];
    // We don't want to exit on the first hoist issue, but log them all and then exit
    let strictExitOnWarning = false;

    // determine where each dependency will be installed
    for (const [externalName, externalDependents] of depsToInstall) {
      let rootVersion;

      if (this.hoisting && isHoistedPackage(externalName, this.hoisting)) {
        const commonVersion = Array.from(externalDependents.keys()).reduce((a, b) =>
          externalDependents.get(a).size > externalDependents.get(b).size ? a : b
        );

        // Get the version required by the repo root (if any).
        // If the root doesn't have a dependency on this package then we'll
        // install the most common dependency there.
        rootVersion = rootExternalVersions.get(externalName) || commonVersion;

        if (rootVersion !== commonVersion) {
          this.logger.warn(
            "EHOIST_ROOT_VERSION",
            `The repository root depends on ${externalName}@${rootVersion}, ` +
              `which differs from the more common ${externalName}@${commonVersion}.`
          );
          if (this.options.strict) {
            strictExitOnWarning = true;
          }
        }

        const dependents = Array.from(externalDependents.get(rootVersion)).map(
          (leafName) => this.targetGraph.get(leafName).pkg
        );

        // remove collection so leaves don't repeat it
        externalDependents.delete(rootVersion);

        // Install the best version we can in the repo root.
        // Even if it's already installed there we still need to make sure any
        // binaries are linked to the packages that depend on them.
        rootActions.push(() =>
          hasDependencyInstalled(rootPkg, externalName, rootVersion).then((isSatisfied) => {
            rootSet.add({
              name: externalName,
              dependents,
              dependency: `${externalName}@${rootVersion}`,
              isSatisfied,
            });
          })
        );
      }

      // Add less common versions to package installs.
      for (const [leafVersion, leafDependents] of externalDependents) {
        for (const leafName of leafDependents) {
          if (rootVersion) {
            this.logger.warn(
              "EHOIST_PKG_VERSION",
              `"${leafName}" package depends on ${externalName}@${leafVersion}, ` +
                `which differs from the hoisted ${externalName}@${rootVersion}.`
            );
            if (this.options.strict) {
              strictExitOnWarning = true;
            }
          }

          const leafNode = this.targetGraph.get(leafName);
          const leafRecord = leaves.get(leafNode) || leaves.set(leafNode, new Set()).get(leafNode);

          // only install dependency if it's not already installed
          leafActions.push(() =>
            hasDependencyInstalled(leafNode.pkg, externalName, leafVersion).then((isSatisfied) => {
              leafRecord.add({
                dependency: `${externalName}@${leafVersion}`,
                isSatisfied,
              });
            })
          );
        }
      }
    }
    if (this.options.strict && strictExitOnWarning) {
      throw new ValidationError(
        "EHOISTSTRICT",
        "Package version inconsistencies found while hoisting. Fix the above warnings and retry."
      );
    }

    return pMapSeries([...rootActions, ...leafActions], (el) => el()).then(() => {
      this.logger.silly("root dependencies", JSON.stringify(rootSet, null, 2));
      this.logger.silly("leaf dependencies", JSON.stringify(leaves, null, 2));

      return { rootSet, leaves };
    });
  }

  /**
   * Install external dependencies for all packages
   * @returns {Promise}
   */
  installExternalDependencies({ leaves, rootSet }) {
    const tracker = this.logger.newItem("install dependencies");
    const rootPkg = this.project.manifest;
    const actions = [];

    // Start root install first, if any, since it's likely to take the longest.
    if (rootSet.size) {
      // If we have anything to install in the root then we'll install
      // _everything_ that needs to go there.  This is important for
      // consistent behavior across npm clients.
      const root = Array.from(rootSet);

      actions.push(() => {
        const depsToInstallInRoot = root.some(({ isSatisfied }) => !isSatisfied)
          ? root.map(({ dependency }) => dependency)
          : [];

        if (depsToInstallInRoot.length) {
          tracker.info("hoist", "Installing hoisted dependencies into root");
        }

        const promise = npmInstallDependencies(rootPkg, depsToInstallInRoot, this.npmConfig);

        return pulseTillDone(promise)
          .then(() =>
            // Link binaries into dependent packages so npm scripts will
            // have access to them.
            pMapSeries(root, ({ name, dependents }) => {
              const { bin } = this.hoistedPackageJson(name);

              if (bin) {
                return pMap(dependents, (pkg) => {
                  const src = this.hoistedDirectory(name);

                  return symlinkBinary(src, pkg);
                });
              }
            })
          )
          .then(() => {
            tracker.info("hoist", "Finished bootstrapping root");
            tracker.completeWork(1);
          });
      });

      // Remove any hoisted dependencies that may have previously been
      // installed in package directories.
      actions.push(() => {
        // Compute the list of candidate directories synchronously
        const candidates = root
          .filter((dep) => dep.dependents.length)
          .reduce((list, { name, dependents }) => {
            const dirs = dependents
              .filter((pkg) => pkg.nodeModulesLocation !== rootPkg.nodeModulesLocation)
              .map((pkg) => path.join(pkg.nodeModulesLocation, name));

            return list.concat(dirs);
          }, []);

        if (!candidates.length) {
          tracker.verbose("hoist", "nothing to prune");
          tracker.completeWork(1); // the action "work"

          return;
        }

        tracker.info("hoist", "Pruning hoisted dependencies");
        tracker.silly("prune", candidates);
        tracker.addWork(candidates.length);

        return pMap(
          candidates,
          (dirPath) =>
            pulseTillDone(rimrafDir(dirPath)).then(() => {
              tracker.verbose("prune", dirPath);
              tracker.completeWork(1);
            }),
          // these are mostly no-ops in the vast majority of cases
          { concurrency: this.concurrency }
        ).then(() => {
          tracker.info("hoist", "Finished pruning hoisted dependencies");
          tracker.completeWork(1); // the action "work"
        });
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
        actions.push(() => {
          const dependencies = deps.map(({ dependency }) => dependency);
          const promise = npmInstallDependencies(leafNode.pkg, dependencies, leafNpmConfig);

          return pulseTillDone(promise).then(() => {
            tracker.verbose("installed leaf", leafNode.name);
            tracker.completeWork(1);
          });
        });
      }
    });

    if (actions.length) {
      tracker.info("", "Installing external dependencies");
      tracker.verbose("actions", "%d actions, concurrency %d", actions.length, this.concurrency);
      tracker.addWork(actions.length);
    }

    return pMap(actions, (act) => act(), { concurrency: this.concurrency }).finally(() => tracker.finish());
  }

  /**
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   * @returns {Promise}
   */
  symlinkPackages() {
    return symlinkDependencies(
      this.filteredPackages,
      this.targetGraph,
      this.logger.newItem("bootstrap dependencies")
    );
  }
}

module.exports.BootstrapCommand = BootstrapCommand;
