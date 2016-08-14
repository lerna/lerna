import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
import async from "async";
import find from "lodash.find";
import path from "path";
import semver from "semver";

export default class BootstrapCommand extends Command {
  initialize(callback) {
    this.configFlags = this.repository.bootstrapConfig;
    callback(null, true);
  }

  execute(callback) {
    this.bootstrapPackages((err) => {
      if (err) {
        callback(err);
      } else {
        this.logger.success(`Successfully bootstrapped ${this.packagesToBootstrap.length} packages.`);
        callback(null, true);
      }
    });
  }

  /**
   * Bootstrap packages
   * @param {Function} callback
   */
  bootstrapPackages(callback) {
    this.packagesToBootstrap = this.filteredPackages;
    if (this.flags.includeFilteredDependencies) {
      this.packagesToBootstrap = PackageUtilities.addDependencies(this.filteredPackages, this.packageGraph);
    }
 
    this.logger.info(`Bootstrapping ${this.packagesToBootstrap.length} packages`);
    this.batchedPackages = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.packagesToBootstrap, this.logger)
      : [ this.packagesToBootstrap ];
    
    async.series([
      // preinstall bootstrapped packages
      (cb) => this.preinstallPackages(cb),
      // install external dependencies
      (cb) => this.installExternalDependencies(cb),
      // symlink packages and their binaries
      (cb) => this.symlinkPackages(cb),
      // postinstall bootstrapped packages
      (cb) => this.postinstallPackages(cb),
      // prepublish bootstrapped packages
      (cb) => this.prepublishPackages(cb)
    ], callback);
  }

  runScriptInPackages(scriptName, callback) {
    if (!this.packagesToBootstrap.length) {
      return callback(null, true);
    }

    this.progressBar.init(this.packagesToBootstrap.length);
    PackageUtilities.runParallelBatches(this.batchedPackages, (pkg) => (done) => {
      pkg.runScript(scriptName, (err) => {
        this.progressBar.tick(pkg.name);
        done(err);
      });
    }, this.concurrency, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  /**
   * Run the "preinstall" NPM script in all bootstrapped packages
   * @param callback
   */
  preinstallPackages(callback) {
    this.logger.info("Preinstalling packages");
    this.runScriptInPackages("preinstall", callback);
  }

  /**
   * Run the "postinstall" NPM script in all bootstrapped packages
   * @param callback
   */
  postinstallPackages(callback) {
    this.logger.info("Postinstalling packages");
    this.runScriptInPackages("postinstall", callback);
  }

  /**
   * Run the "prepublish" NPM script in all bootstrapped packages
   * @param callback
   */
  prepublishPackages(callback) {
    this.logger.info("Prepublishing packages");
    this.runScriptInPackages("prepublish", callback);
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
      actions.push((cb) => FileSystemUtilities.symlink(binFile, destBinFiles[idx], "exec", cb));
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
   * Install external dependencies for all packages
   * @param {Function} callback
   */
  installExternalDependencies(callback) {
    this.logger.info("Installing external dependencies");
    this.progressBar.init(this.packagesToBootstrap.length);
    const actions = [];
    this.packagesToBootstrap.forEach((pkg) => {
      const allDependencies = pkg.allDependencies;
      const externalPackages = Object.keys(allDependencies)
        .filter((dependency) => {
          const match = find(this.packages, (pkg) => {
            return pkg.name === dependency;
          });
          return !(match && pkg.hasMatchingDependency(match));
        })
        .filter((dependency) => !pkg.hasDependencyInstalled(dependency))
        .map((dependency) => dependency + "@" + allDependencies[dependency]);
      if (externalPackages.length) {
        actions.push((cb) => NpmUtilities.installInDir(pkg.location, externalPackages, (err) => {
          this.progressBar.tick(pkg.name);
          cb(err);
        }));
      }
    });
    async.parallelLimit(actions, this.concurrency, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  /**
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   * @param {Function} callback
   */
  symlinkPackages(callback) {
    this.logger.info("Symlinking packages and binaries");
    this.progressBar.init(this.packagesToBootstrap.length);
    const actions = [];
    this.packagesToBootstrap.forEach((filteredPackage) => {
      // actions to run for this package
      const packageActions = [];
      Object.keys(filteredPackage.allDependencies)
        // filter out external dependencies and incompatible packages
        .filter((dependency) => {
          const match = this.packageGraph.get(dependency);
          return match && filteredPackage.hasMatchingDependency(match.package);
        })
        .forEach((dependency) => {
          // get Package of dependency
          const dependencyPackage = this.packageGraph.get(dependency).package;
          // get path to dependency and its scope
          const { location: dependencyLocation } = dependencyPackage;
          const dependencyPackageJsonLocation = path.join(dependencyLocation, "package.json");
          // ignore dependencies without a package.json file
          if (!FileSystemUtilities.existsSync(dependencyPackageJsonLocation)) {
            this.logger.error(
              `Unable to find package.json for ${dependency} dependency of ${filteredPackage.name},  ` +
              "Skipping..."
            );
          } else {
            // get the destination directory name of the dependency
            const pkgDependencyLocation = path.join(filteredPackage.nodeModulesLocation, dependencyPackage.name);
            // check if dependency is already installed
            if (FileSystemUtilities.existsSync(pkgDependencyLocation)) {
              const isDepSymlink = FileSystemUtilities.isSymlink(pkgDependencyLocation);
              // installed dependency is a symlink pointing to a different location
              if (isDepSymlink !== false && isDepSymlink !== dependencyLocation) {
                this.logger.warn(
                  `Symlink already exists for ${dependency} dependency of ${filteredPackage.name}, ` +
                  "but links to different location. Replacing with updated symlink..."
                );
              // installed dependency is not a symlink
              } else if (isDepSymlink === false) {
                this.logger.warn(
                  `${dependency} is already installed for ${filteredPackage.name}. ` +
                  "Replacing with symlink..."
                );
                // remove installed dependency
                packageActions.push((cb) => FileSystemUtilities.rimraf(pkgDependencyLocation, cb));
              }
            }
            // ensure destination path
            packageActions.push((cb) => FileSystemUtilities.mkdirp(
              pkgDependencyLocation.split(path.sep).slice(0, -1).join(path.sep), cb
            ));
            // create package symlink
            packageActions.push((cb) => FileSystemUtilities.symlink(
              dependencyLocation, pkgDependencyLocation, "junction", cb
            ));
            const dependencyPackageJson = require(dependencyPackageJsonLocation);
            if (dependencyPackageJson.bin) {
              const destFolder = filteredPackage.nodeModulesLocation;
              packageActions.push((cb) => {
                this.createBinaryLink(dependencyLocation, destFolder, dependency, dependencyPackageJson.bin, cb);
              });
            }
          }
        });
      actions.push((cb) => {
        async.series(packageActions, (err) => {
          this.progressBar.tick(filteredPackage.name);
          cb(err);
        });
      });
    });
    async.series(actions, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }
}
