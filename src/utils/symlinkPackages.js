"use strict";

const async = require("async");
const path = require("path");

const FileSystemUtilities = require("../FileSystemUtilities");
const createBinaryLink = require("./createBinaryLink");

module.exports = symlinkPackages;

/**
 * Symlink all packages to the packages/node_modules directory
 * Symlink package binaries to dependent packages' node_modules/.bin directory
 * @param {Array.<Package>} packages
 * @param {Object} packageGraph
 * @param {Object} logger
 * @param {Function} callback
 */
function symlinkPackages(packages, packageGraph, logger, callback) {
  const tracker = logger.newItem("symlink packages");

  tracker.info("", "Symlinking packages and binaries");
  tracker.addWork(packages.length);

  const nodes =
    packageGraph.size === packages.length
      ? packageGraph.values()
      : new Set(packages.map(({ name }) => packageGraph.get(name)));

  const actions = Array.from(nodes).map(currentNode => {
    const { nodeModulesLocation } = currentNode.pkg;

    // actions to run for this package
    const packageActions = [];

    currentNode.localDependencies.forEach(({ type }, dependencyName) => {
      if (type === "directory") {
        // a local file: specifier is already a symlink
        return;
      }

      // get PackageGraphNode of dependency
      const dependencyNode = packageGraph.get(dependencyName);
      const targetDirectory = path.join(nodeModulesLocation, dependencyName);

      // check if dependency is already installed
      if (FileSystemUtilities.existsSync(targetDirectory)) {
        const isDepSymlink = FileSystemUtilities.isSymlink(targetDirectory);

        if (isDepSymlink !== false && isDepSymlink !== dependencyNode.location) {
          // installed dependency is a symlink pointing to a different location
          tracker.warn(
            "EREPLACE_OTHER",
            `Symlink already exists for ${dependencyName} dependency of ${currentNode.name}, ` +
              "but links to different location. Replacing with updated symlink..."
          );
        } else if (isDepSymlink === false) {
          // installed dependency is not a symlink
          tracker.warn(
            "EREPLACE_EXIST",
            `${dependencyName} is already installed for ${currentNode.name}. Replacing with symlink...`
          );

          // remove installed dependency
          packageActions.push(next => FileSystemUtilities.rimraf(targetDirectory, next));
        }
      } else {
        // ensure destination directory exists (dealing with scoped subdirs)
        packageActions.push(next => FileSystemUtilities.mkdirp(path.dirname(targetDirectory), next));
      }

      // create package symlink
      packageActions.push(next => {
        FileSystemUtilities.symlink(dependencyNode.location, targetDirectory, "junction", next);
      });

      packageActions.push(next => {
        // TODO: pass PackageGraphNodes directly instead of Packages
        createBinaryLink(dependencyNode.pkg, currentNode.pkg, next);
      });
    });

    return finish => {
      async.series(packageActions, err => {
        tracker.silly("packageActions", "finished", currentNode.name);
        tracker.completeWork(1);
        finish(err);
      });
    };
  });

  async.series(actions, err => {
    tracker.finish();
    callback(err);
  });
}
