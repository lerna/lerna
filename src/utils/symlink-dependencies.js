"use strict";

const pFinally = require("p-finally");
const pMapSeries = require("p-map-series");
const path = require("path");

const FileSystemUtilities = require("../FileSystemUtilities");
const createSymlink = require("./create-symlink");
const resolveSymlink = require("./resolve-symlink");
const symlinkBinary = require("./symlink-binary");

module.exports = symlinkDependencies;

/**
 * Symlink all packages to the packages/node_modules directory
 * Symlink package binaries to dependent packages' node_modules/.bin directory
 * @param {Array.<Package>} packages
 * @param {Object} packageGraph
 * @param {Object} logger
 * @param {Function} callback
 */
function symlinkDependencies(packages, packageGraph, logger) {
  const tracker = logger.newItem("symlink packages");

  tracker.info("", "Symlinking packages and binaries");
  tracker.addWork(packages.length);

  const nodes =
    packageGraph.size === packages.length
      ? packageGraph.values()
      : new Set(packages.map(({ name }) => packageGraph.get(name)));

  const actions = pMapSeries(nodes, currentNode => {
    const { nodeModulesLocation } = currentNode.pkg;

    // actions to run for this package
    let packageActions = Promise.resolve();

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
        const isDepSymlink = resolveSymlink(targetDirectory);

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
          packageActions = packageActions.then(() => FileSystemUtilities.rimraf(targetDirectory));
        }
      } else {
        // ensure destination directory exists (dealing with scoped subdirs)
        packageActions = packageActions.then(FileSystemUtilities.mkdirp(path.dirname(targetDirectory)));
      }

      // create package symlink
      packageActions = packageActions.then(() =>
        createSymlink(dependencyNode.location, targetDirectory, "junction")
      );

      // TODO: pass PackageGraphNodes directly instead of Packages
      packageActions = packageActions.then(() => symlinkBinary(dependencyNode.pkg, currentNode.pkg));
    });

    return packageActions.then(() => {
      tracker.silly("packageActions", "finished", currentNode.name);
      tracker.completeWork(1);
    });
  });

  return pFinally(actions, () => tracker.finish());
}
