import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
import semver from "semver";
import async from "async";
import find from "lodash.find";
import path from "path";

export default class BootstrapCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    this.bootstrapPackages((err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully bootstrapped ${this.filteredPackages.length} packages.`);
        callback(null, true);
      }
    });
  }

  /**
   * Bootstrap packages
   * @param {Function} callback
   */
  bootstrapPackages(callback) {
    this.filteredPackages = this.getPackages();
    this.filteredGraph = PackageUtilities.getPackageGraph(this.filteredPackages);
    this.logger.info(`Bootstrapping ${this.filteredPackages.length} packages`);
    const depsToInstall = this.getDependenciesToInstall(this.filteredPackages);
    async.series([
      // install external dependencies (do this first)
      (cb) => this.installDependencies(depsToInstall, cb),
      // symlink dependencies and their binaries
      (cb) => this.symlinkDependencies(cb),
      // prepublish bootstrapped packages
      (cb) => this.prepublishPackages(cb)
    ], callback);
  }

  /**
   * Get packages to bootstrap
   * @returns {Array.<Package>}
   */
  getPackages() {
    const ignore = this.flags.ignore || this.repository.bootstrapConfig.ignore;
    if (ignore) {
      this.logger.info(`Ignoring packages that match '${ignore}'`);
    }
    return PackageUtilities.filterPackages(this.packages, ignore, true);
  }

  /**
   * Run the "prepublish" NPM script in all bootstrapped packages
   * @param callback
   */
  prepublishPackages(callback) {
    this.logger.info("Prepublishing packages");

    // Get a filtered list of packages that will be prepublished.
    const todoPackages = this.filteredPackages.slice();

    this.progressBar.init(todoPackages.length);

    // This maps package names to the number of packages that depend on them.
    // As packages are completed their names will be removed from this object.
    const pendingDeps = {};
    todoPackages.forEach((pkg) => this.filteredGraph.get(pkg.name).dependencies.forEach((dep) => {
      if (!pendingDeps[dep]) pendingDeps[dep] = 0;
      pendingDeps[dep]++;
    }));

    // Bootstrap runs the "prepublish" script in each package.  This script
    // may _use_ another package from the repo.  Therefore if a package in the
    // repo depends on another we need to bootstrap the dependency before the
    // dependent.  So the bootstrap proceeds in batches of packages where each
    // batch includes all packages that have no remaining un-bootstrapped
    // dependencies within the repo.
    const bootstrapBatch = () => {
      // Get all packages that have no remaining dependencies within the repo
      // that haven't yet been bootstrapped.
      const batch = todoPackages.filter((pkg) => {
        const node = this.filteredGraph.get(pkg.name);
        return !node.dependencies.filter((dep) => pendingDeps[dep]).length;
      });

      // If we weren't able to find a package with no remaining dependencies,
      // then we've encountered a cycle in the dependency graph.  Run a
      // single-package batch with the package that has the most dependents.
      if (todoPackages.length && !batch.length) {
        this.logger.warning(
          "Encountered a cycle in the dependency graph.  " +
          "This may cause instability if dependencies are used during `prepublish`."
        );
        batch.push(todoPackages.reduce((a, b) => (
          (pendingDeps[a.name] || 0) > (pendingDeps[b.name] || 0) ? a : b
        )));
      }

      async.parallelLimit(batch.map((pkg) => (done) => {
        pkg.runScript("prepublish", (err) => {
          this.progressBar.tick(pkg.name);
          delete pendingDeps[pkg.name];
          todoPackages.splice(todoPackages.indexOf(pkg), 1);
          done(err);
        });
      }), this.concurrency, (err) => {
        if (todoPackages.length && !err) {
          bootstrapBatch();
        } else {
          this.progressBar.terminate();
          callback(err);
        }
      });
    };

    // Kick off the first batch.
    bootstrapBatch();
  }

  /**
   * Create a symlink to a dependency's binary in the node_modules/.bin folder
   * @param {String} src
   * @param {String} dest
   * @param {String} name
   * @param {String|Object} bin
   * @param {Function} callback
   */
  createBinaryLink(src, dest, name, bin, callback) {
    const destBinFolder = path.join(dest, ".bin");
    // The `bin` in a package.json may be either a string or an object.
    // Normalize to an object.
    const bins = typeof bin === "string"
      ? { [name]: bin }
      : bin;
    const srcBinFiles = [];
    const destBinFiles = [];
    Object.keys(bins).forEach((name) => {
      srcBinFiles.push(path.join(src, bins[name]));
      destBinFiles.push(path.join(destBinFolder, name));
    });
    // make sure when have a destination folder (node_modules/.bin)
    const actions = [(cb) => FileSystemUtilities.mkdirp(destBinFolder, cb)];
    // symlink each binary
    srcBinFiles.forEach((binFile, idx) => {
      actions.push((cb) => FileSystemUtilities.symlink(binFile, destBinFiles[idx], "file", cb));
    });
    async.series(actions, callback);
  }

  /**
   * Determine if a dependency installed at the root satifies the requirements of the passed packages
   * This helps to optimize the bootstrap process and skip dependencies that are already installed
   * @param {String} dependency
   * @param {Array.<String>} packages
   */
  dependencySatisfiesPackages(dependency, packages) {
    const packageJson = path.join(this.repository.rootPath, "node_modules", dependency, "package.json");
    try {
      return packages.every((pkg) => {
        return semver.satisfies(
          require(packageJson).version,
          pkg.allDependencies[dependency]
        );
      });
    } catch (e) {
      return false;
    }
  }

  /**
   * Given an array of packages, return map of dependencies to install
   * @param {Array.<Package>} packages An array of packages
   * @returns {Object}
   */
  getDependenciesToInstall(packages = []) {
    // find package by name
    const findPackage = (name, version) => find(this.packages, (pkg) => {
      return pkg.name === name && (!version || semver.satisfies(pkg.version, version));
    });
    const hasPackage = (name, version) => Boolean(findPackage(name, version));
    /**
     * Map of dependency install locations
     *   - keys represent a package name (i.e. "my-component")
     *     "__ROOT__" is a special value and refers to the root folder
     *   - values are an array of strings representing the dependency and its version to install
     *     (i.e. ["react@15.x", "react-dom@^15.0.0", "webpack@~1.13.0"]
     *
     * {
     *   <package>: [<dependency1@version>, <dependency2@version>, ...]
     * }
     */
    const installs = { __ROOT__: [] };
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
    // get the map of external dependencies to install
    packages.forEach((pkg) => {
      // for all package dependencies
      Object.keys(pkg.allDependencies)
      // map to package or normalized external dependency
        .map((name) => findPackage(name, pkg.allDependencies[name]) || { name, version: pkg.allDependencies[name] })
        // match external and version mismatched local packages
        .filter((dep) => !hasPackage(dep.name, dep.version) || !pkg.hasMatchingDependency(dep))
        .forEach((dep) => {
          const { name, version } = dep;
          if (!depsToInstall[name]) {
            depsToInstall[name] = {
              versions: {},
              dependents: {}
            };
          }
          // add dependency version
          if (!depsToInstall[name].versions[version]) {
            depsToInstall[name].versions[version] = 1;
          } else {
            depsToInstall[name].versions[version]++;
          }
          // add package with required version
          if (!depsToInstall[name].dependents[version]) {
            depsToInstall[name].dependents[version] = [];
          }
          depsToInstall[name].dependents[version].push(pkg.name);
        });
    });
    // determine where each dependency will be installed
    Object.keys(depsToInstall).forEach((name) => {
      const allVersions = Object.keys(depsToInstall[name].versions);
      // create an object whose keys are the number of dependents
      // with values that are the version those dependents need
      const reversedVersions = Object.keys(depsToInstall[name].versions).reduce((versions, version) => {
        versions[depsToInstall[name].versions[version]] = version;
        return versions;
      }, {});
      // get the most common version
      const max = Math.max.apply(null, Object.keys(reversedVersions).map((v) => parseInt(v, 10)));
      const commonVersion = reversedVersions[max.toString()];
      // get an array of packages that depend on this external module
      const deps = depsToInstall[name].dependents[commonVersion];
      // check if the external dependency is not a package with a version mismatch,
      // and is not already installed at root
      if (!hasPackage(name) && !this.dependencySatisfiesPackages(name, deps.map((dep) => findPackage(dep)))) {
        // add the common version to root install
        installs.__ROOT__.push(`${name}@${commonVersion}`);
      }
      // add less common versions to package installs
      allVersions.forEach((version) => {
        // only install less common versions,
        // unless it's a version-mismatched package
        if (version !== commonVersion || hasPackage(name)) {
          depsToInstall[name].dependents[version].forEach((pkg) => {
            // only install dependency if it's not already installed
            if (!findPackage(pkg).hasDependencyInstalled(name)) {
              if (!installs[pkg]) {
                installs[pkg] = [];
              }
              installs[pkg].push(`${name}@${version}`);
              this.logger.warning(
                `"${pkg}" package depends on ${name}@${version}, ` +
                `which differs from the more common ${name}@${commonVersion}.`
              );
            }
          });
        }
      });
    });
    return installs;
  }

  /**
   * Install dependencies for all packages
   * @param {Object} dependencies
   * @param {Function} callback
   */
  installDependencies(dependencies, callback) {
    const actions = [];
    let externalDepsToInstall = 0;
    Object.keys(dependencies).forEach((dest) => {
      const destLocation = dest === "__ROOT__"
        ? this.repository.rootPath
        : path.join(this.repository.packagesLocation, dest);
      if (dependencies[dest].length) {
        externalDepsToInstall += dependencies[dest].length;
        actions.push((cb) => NpmUtilities.installInDir(destLocation, dependencies[dest], cb));
      }
    });
    if (externalDepsToInstall > 0) {
      this.logger.info(`Installing ${externalDepsToInstall} external dependencies`);
    }
    async.parallelLimit(actions, this.concurrency, callback);
  }

  /**
   * Symlink all bootstrapped packages to the root node_modules directory
   * Symlink dependency binaries to all bootstrapped packages' node_modules/.bin directory
   * @param {Function} callback
   */
  symlinkDependencies(callback) {
    this.logger.info("Symlinking package dependencies and binaries");
    const actions = [];
    const localPackages = this.packages.map((pkg) => pkg.name);
    const rootNodeModulesLocation = path.join(this.repository.rootPath, "node_modules");
    actions.push((cb) => FileSystemUtilities.mkdirp(rootNodeModulesLocation, cb));
    this.filteredPackages.forEach((pkg) => {
      const destFolder = path.join(this.repository.packagesLocation, pkg.name, "node_modules");
      const packageLocation = path.join(this.repository.packagesLocation, pkg.name);
      const packageLinkLocation = path.join(rootNodeModulesLocation, pkg.name);
      actions.push((cb) => FileSystemUtilities.symlink(packageLocation, packageLinkLocation, "dir", cb));
      actions.push((cb) => FileSystemUtilities.mkdirp(destFolder, cb));
      Object.keys(pkg.allDependencies)
        // filter out already install dependencies
        .filter((dependency) => !pkg.hasDependencyInstalled(dependency))
        .forEach((dependency) => {
          // get path to dependency
          const dependencyLocation = localPackages.indexOf(dependency) !== -1
            // dependency is a local package
            ? path.join(this.repository.packagesLocation, dependency)
            // dependency is external and installed at the root path
            : path.join(this.repository.rootPath, "node_modules", dependency);
          // make sure path to dependency package.json exists
          const dependencyPackageJsonLocation = path.join(dependencyLocation, "package.json");
          // ignore dependencies without a package.json file
          if (!FileSystemUtilities.existsSync(dependencyPackageJsonLocation)) {
            this.logger.error(`Unable to find package.json for ${dependency} dependency`);
          } else {
            const dependencyPackageJson = require(dependencyPackageJsonLocation);
            if (dependencyPackageJson.bin) {
              actions.push((cb) => {
                this.createBinaryLink(dependencyLocation, destFolder, dependency, dependencyPackageJson.bin, cb);
              });
            }
          }
        });
    });
    async.series(actions, callback);
  }
}
