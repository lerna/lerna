import FileSystemUtilities from "./FileSystemUtilities";
import logger from "./logger";
import async from "async";
import path from "path";

export default class LinkUtilities {
  /**
   * Create a symlink to a dependency's binary in the node_modules/.bin folder
   * @param {String} src
   * @param {String} dest
   * @param {String} name
   * @param {String|Object} bin
   * @param {Function} callback
   */
  @logger.logifyAsync()
  static _createBinaryLink(src, dest, name, bin, callback) {
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
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   */
  static symlinkPackages(packages, packageGraph, progressBar, logger, callback) {
    logger.info("Symlinking packages and binaries");
    progressBar.init(packages.length);
    const actions = [];
    packages.forEach((pkg) => {
      // actions to run for this package
      const packageActions = [];
      Object.keys(pkg.allDependencies)
        // filter out external dependencies and incompatible packages
        .filter((dependency) => {
          const match = packageGraph.get(dependency);
          return match && pkg.hasMatchingDependency(match.package);
        })
        .forEach((dependency) => {
          // get Package of dependency
          const dependencyPackage = packageGraph.get(dependency).package;
          // get path to dependency and its scope
          const { location: dependencyLocation } = dependencyPackage;
          const dependencyPackageJsonLocation = path.join(dependencyLocation, "package.json");
          // ignore dependencies without a package.json file
          if (!FileSystemUtilities.existsSync(dependencyPackageJsonLocation)) {
            logger.error(
              `Unable to find package.json for ${dependency} dependency of ${pkg.name},  ` +
              "Skipping..."
            );
          } else {
            // get the destination directory name of the dependency
            const pkgDependencyLocation = path.join(pkg.nodeModulesLocation, dependencyPackage.name);
            // check if dependency is already installed
            if (FileSystemUtilities.existsSync(pkgDependencyLocation)) {
              const isDepSymlink = FileSystemUtilities.isSymlink(pkgDependencyLocation);
              // installed dependency is a symlink pointing to a different location
              if (isDepSymlink !== false && isDepSymlink !== dependencyLocation) {
                logger.warn(
                  `Symlink already exists for ${dependency} dependency of ${pkg.name}, ` +
                  "but links to different location. Replacing with updated symlink..."
                );
              // installed dependency is not a symlink
              } else if (isDepSymlink === false) {
                logger.warn(
                  `${dependency} is already installed for ${pkg.name}. ` +
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
              const destFolder = pkg.nodeModulesLocation;
              packageActions.push((cb) => {
                LinkUtilities._createBinaryLink(dependencyLocation, destFolder, dependency, dependencyPackageJson.bin, cb);
              });
            }
          }
        });
      actions.push((cb) => {
        async.series(packageActions, (err) => {
          progressBar.tick(pkg.name);
          cb(err);
        });
      });
    });
    async.series(actions, (err) => {
      progressBar.terminate();
      callback(err);
    });
  }
}
