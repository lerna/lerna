import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
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
    async.series([
      // install external dependencies
      (cb) => this.installExternalDependencies(cb),
      // symlink packages and their binaries
      (cb) => this.symlinkPackages(cb),
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
   * Install external dependencies for all packages
   * @param {Function} callback
   */
  installExternalDependencies(callback) {
    this.logger.info("Installing external dependencies");
    this.progressBar.init(this.filteredPackages.length);
    const actions = [];
    this.filteredPackages.forEach((pkg) => {
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
    const actions = [];
    // packages to symlink
    const symlinkPackages = [];
    const packagesNodeModulesLocation = path.join(this.repository.packagesLocation, "node_modules");
    actions.push((cb) => FileSystemUtilities.rimraf(packagesNodeModulesLocation, cb));
    actions.push((cb) => FileSystemUtilities.mkdirp(packagesNodeModulesLocation, cb));
    this.filteredPackages.forEach((pkg) => {
      Object.keys(pkg.allDependencies)
        // filter out external packages and version mismatched local packages
        .filter((dependency) => {
          const match = find(this.packages, (pkg) => {
            return pkg.name === dependency;
          });
          return match && pkg.hasMatchingDependency(match);
        })
        // filter out already install dependencies
        .filter((dependency) => !pkg.hasDependencyInstalled(dependency))
        .forEach((dependency) => {
          // get path to dependency
          const dependencyLocation = path.join(this.repository.packagesLocation, dependency);
          // make sure path to dependency package.json exists
          const dependencyPackageJsonLocation = path.join(dependencyLocation, "package.json");
          // ignore dependencies without a package.json file
          if (!FileSystemUtilities.existsSync(dependencyPackageJsonLocation)) {
            this.logger.error(`Unable to find package.json for ${dependency} dependency. Skipping...`);
          } else {
            // add package to packages being symlinked
            if (symlinkPackages.indexOf(dependency) === -1) {
              symlinkPackages.push(dependency);
            }
            const dependencyPackageJson = require(dependencyPackageJsonLocation);
            if (dependencyPackageJson.bin) {
              const destFolder = path.join(this.repository.packagesLocation, pkg.name, "node_modules");
              actions.push((cb) => {
                this.createBinaryLink(dependencyLocation, destFolder, dependency, dependencyPackageJson.bin, cb);
              });
            }
          }
        });
    });
    // symlink packages depended on by other packages being bootstrapped
    symlinkPackages.forEach((packageName) => {
      const packageLocation = path.join(this.repository.packagesLocation, packageName);
      const packageLinkLocation = path.join(packagesNodeModulesLocation, packageName);
      actions.push((cb) => FileSystemUtilities.symlink(packageLocation, packageLinkLocation, "dir", cb));
    });
    async.series(actions, callback);
  }
}
