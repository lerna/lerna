import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import LinkUtilities from "../LinkUtilities";
import Command from "../Command";
import async from "async";
import find from "lodash.find";

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
    this.logger.info(`Bootstrapping ${this.filteredPackages.length} packages`);
    this.batchedPackages = this.flags.toposort
      ? PackageUtilities.topologicallyBatchPackages(this.filteredPackages, this.logger)
      : [ this.filteredPackages ];
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
    this.progressBar.init(this.filteredPackages.length);

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
    LinkUtilities.symlinkPackages(this.filteredPackages, this.packageGraph, this.progressBar, this.logger, callback);
  }
}
