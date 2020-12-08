"use strict";

const fs = require("fs-extra");
const pMap = require("p-map");
const pMapSeries = require("p-map-series");
const path = require("path");

const { createSymlink } = require("@lerna/create-symlink");
const { resolveSymlink } = require("@lerna/resolve-symlink");
const { symlinkBinary } = require("@lerna/symlink-binary");

module.exports.symlinkDependencies = symlinkDependencies;

/**
 * Symlink all packages to the packages/node_modules directory
 * Symlink package binaries to dependent packages' node_modules/.bin directory
 * @param {Array.<Package>} packages
 * @param {Object} packageGraph
 * @param {Tracker} tracker
 * @returns {Promise}
 */
function symlinkDependencies(packages, packageGraph, tracker) {
  tracker.info("", "Symlinking packages and binaries");
  tracker.addWork(packages.length);

  const nodes =
    packageGraph.size === packages.length
      ? packageGraph.values()
      : new Set(packages.map(({ name }) => packageGraph.get(name)));

  return pMapSeries(nodes, (currentNode) => {
    const currentName = currentNode.name;
    const currentNodeModules = currentNode.pkg.nodeModulesLocation;

    return pMap(currentNode.localDependencies, ([dependencyName, resolved]) => {
      if (resolved.type === "directory") {
        // a local file: specifier is already a symlink
        return;
      }

      // get PackageGraphNode of dependency
      // const dependencyName = resolved.name;
      const dependencyNode = packageGraph.get(dependencyName);
      const targetDirectory = path.join(currentNodeModules, dependencyName);

      let chain = Promise.resolve();

      // check if dependency is already installed
      chain = chain.then(() => fs.pathExists(targetDirectory));
      chain = chain.then((dirExists) => {
        if (dirExists) {
          const isDepSymlink = resolveSymlink(targetDirectory);

          if (isDepSymlink !== false && isDepSymlink !== dependencyNode.location) {
            // installed dependency is a symlink pointing to a different location
            tracker.warn(
              "EREPLACE_OTHER",
              `Symlink already exists for ${dependencyName} dependency of ${currentName}, ` +
                "but links to different location. Replacing with updated symlink..."
            );
          } else if (isDepSymlink === false) {
            // installed dependency is not a symlink
            tracker.warn(
              "EREPLACE_EXIST",
              `${dependencyName} is already installed for ${currentName}. Replacing with symlink...`
            );

            // remove installed dependency
            return fs.remove(targetDirectory);
          }
        } else {
          // ensure destination directory exists (dealing with scoped subdirs)
          return fs.ensureDir(path.dirname(targetDirectory));
        }
      });

      // create package symlink
      const dependencyLocation = dependencyNode.pkg.contents
        ? path.resolve(dependencyNode.location, dependencyNode.pkg.contents)
        : dependencyNode.location;
      chain = chain.then(() => createSymlink(dependencyLocation, targetDirectory, "junction"));

      // TODO: pass PackageGraphNodes directly instead of Packages
      chain = chain.then(() => symlinkBinary(dependencyNode.pkg, currentNode.pkg));

      return chain;
    }).then(() => {
      tracker.silly("actions", "finished", currentName);
      tracker.completeWork(1);
    });
  }).finally(() => tracker.finish());
}
