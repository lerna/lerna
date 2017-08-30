import async from "async";
import glob from "glob";
import log from "npmlog";
import minimatch from "minimatch";
import path from "path";
import readPkg from "read-pkg";

import PackageGraph from "./PackageGraph";
import FileSystemUtilities from "./FileSystemUtilities";
import Package from "./Package";

/**
* A predicate that determines if a given package name satisfies a glob.
*
* @param {!String} name The package name
* @param {String|Array<String>} glob The glob (or globs) to match a package name against
* @param {Boolean} negate Negate glob pattern matches
* @return {Boolean} The packages with a name matching the glob
*/
function filterPackage(name, glob, negate) {
  // If there isn't a filter then we can just return the package.
  if (!glob) return true;

  // Include/exlude with no arguments implies splat.
  // For example: `--hoist` is equivalent to `--hoist=**`.
  // The double star here is to account for scoped packages.
  if (glob === true) glob = "**";

  if (!Array.isArray(glob)) glob = [glob];

  if (negate) {
    return glob.every((glob) => !minimatch(name, glob));
  } else {
    return glob.some((glob) => minimatch(name, glob));
  }
}

export default class PackageUtilities {
  static isHoistedPackage(name, hoist, nohoist) {
    return (
      filterPackage(name, hoist) &&
      filterPackage(name, nohoist, true)
    );
  }

  static getPackages({
    packageConfigs,
    rootPath,
  }) {
    const packages = [];
    const globOpts = {
      cwd: rootPath,
      strict: true,
      absolute: true,
    };

    const hasNodeModules = packageConfigs.some((cfg) => cfg.indexOf("node_modules") > -1);
    const hasGlobStar = packageConfigs.some((cfg) => cfg.indexOf("**") > -1);

    if (hasGlobStar) {
      if (hasNodeModules) {
        const message = "An explicit node_modules package path does not allow globstars (**)";
        log.error("EPKGCONFIG", message);
        throw new Error(message);
      }

      globOpts.ignore = [
        // allow globs like "packages/**",
        // but avoid picking up node_modules/**/package.json
        "**/node_modules/**",
      ];
    }

    packageConfigs.forEach((globPath) => {
      glob.sync(path.join(globPath, "package.json"), globOpts)
        .forEach((globResult) => {
          // https://github.com/isaacs/node-glob/blob/master/common.js#L104
          // glob always returns "\\" as "/" in windows, so everyone
          // gets normalized because we can't have nice things.
          const packageConfigPath = path.normalize(globResult);
          const packageDir = path.dirname(packageConfigPath);
          const packageJson = readPkg.sync(packageConfigPath, { normalize: false });
          packages.push(new Package(packageJson, packageDir));
        });
    });

    return packages;
  }

  static getPackageGraph(packages, depsOnly) {
    return new PackageGraph(packages, depsOnly);
  }

  /**
  * Takes a list of Packages and returns a list of those same Packages with any Packages
  * they depend on. i.e if packageA depended on packageB
  * `PackageUtilities.addDependencies([packageA], this.packageGraph)`
  * would return [packageA, packageB]
  * @param {!Array.<Package>} packages The packages to include dependencies for.
  * @param {!<PackageGraph>} packageGraph The package graph for the whole repository.
  * @return {Array.<Package>} The packages with any dependencies that were't already included.
  */
  static addDependencies(packages, packageGraph) {
    const dependentPackages = [];

    // the current list of packages we are expanding using breadth-first-search
    const fringe = packages.slice();
    const packageExistsInRepository = (packageName) => (!!packageGraph.get(packageName));
    const packageAlreadyFound = (packageName) => dependentPackages.some((pkg) => pkg.name === packageName);
    const packageInFringe = (packageName) => fringe.some((pkg) => pkg.name === packageName);

    while (fringe.length !== 0) {
      const pkg = fringe.shift();
      const pkgDeps = Object.assign({}, pkg.dependencies, pkg.devDependencies);

      Object.keys(pkgDeps).forEach((dep) => {
        if (packageExistsInRepository(dep) && !packageAlreadyFound(dep) && !packageInFringe(dep)) {
          fringe.push(packageGraph.get(dep).package);
        }
      });

      if (!packageAlreadyFound(pkg.name)) {
        dependentPackages.push(pkg);
      }
    }

    return dependentPackages;
  }

  /**
  * Filters a given set of packages and returns all packages that match the scope glob
  * and do not match the ignore glob
  *
  * @param {!Array.<Package>} packagesToFilter The packages to filter
  * @param {Object} filters The scope and ignore filters.
  * @param {String} filters.scope glob The glob to match the package name against
  * @param {String} filters.ignore glob The glob to filter the package name against
  * @return {Array.<Package>} The packages with a name matching the glob
  * @throws when a given glob would produce an empty list of packages
  */
  static filterPackages(packagesToFilter, { scope, ignore }) {
    let packages = packagesToFilter.slice();

    if (scope) {
      packages = packages.filter((pkg) => filterPackage(pkg.name, scope));

      if (!packages.length) {
        throw new Error(`No packages found that match scope '${scope}'`);
      }
    }

    if (ignore) {
      packages = packages.filter((pkg) => filterPackage(pkg.name, ignore, true));

      if (!packages.length) {
        throw new Error(`No packages remain after ignoring '${ignore}'`);
      }
    }

    return packages;
  }

  static filterPackagesThatAreNotUpdated(packagesToFilter, packageUpdates) {
    return packageUpdates
      .map((update) => update.package)
      .filter((pkg) => packagesToFilter.some((p) => p.name === pkg.name))
    ;
  }

  static topologicallyBatchPackages(packagesToBatch, { depsOnly } = {}) {
    // We're going to be chopping stuff out of this array, so copy it.
    const packages = packagesToBatch.slice();
    const packageGraph = PackageUtilities.getPackageGraph(packages, depsOnly);

    // This maps package names to the number of packages that depend on them.
    // As packages are completed their names will be removed from this object.
    const refCounts = {};
    packages.forEach((pkg) => packageGraph.get(pkg.name).dependencies.forEach((dep) => {
      if (!refCounts[dep]) refCounts[dep] = 0;
      refCounts[dep]++;
    }));

    const batches = [];
    while (packages.length) {
      // Get all packages that have no remaining dependencies within the repo
      // that haven't yet been picked.
      const batch = packages.filter((pkg) => {
        const node = packageGraph.get(pkg.name);
        return node.dependencies.filter((dep) => refCounts[dep]).length == 0;
      });

      // If we weren't able to find a package with no remaining dependencies,
      // then we've encountered a cycle in the dependency graph.  Run a
      // single-package batch with the package that has the most dependents.
      if (packages.length && !batch.length) {
        log.warn(
          "ECYCLE",
          "Encountered a cycle in the dependency graph. This may cause instability!"
        );

        batch.push(packages.reduce((a, b) => {
          return (refCounts[a.name] || 0) > (refCounts[b.name] || 0) ? a : b;
        }));
      }

      batches.push(batch);

      batch.forEach((pkg) => {
        delete refCounts[pkg.name];
        packages.splice(packages.indexOf(pkg), 1);
      });
    }

    return batches;
  }

  static runParallelBatches(batches, makeTask, concurrency, callback) {
    async.series(batches.map((batch) => (cb) => {
      async.parallelLimit(batch.map(makeTask), concurrency, cb);
    }), callback);
  }


  /**
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   * @param {Array.<Package>} packages
   * @param {Object} packageGraph
   * @param {Object} logger
   * @param {Function} callback
   */
  static symlinkPackages(packages, packageGraph, logger, callback) {
    const tracker = logger.newItem("symlink packages");

    tracker.info("", "Symlinking packages and binaries");
    tracker.addWork(packages.length);

    const actions = packages.map((iteratedPackage) => {
      const filteredDependencyNames = Object
        .keys(iteratedPackage.allDependencies)
        .filter((dependency) => {
          // Filter out external dependencies and incompatible packages
          // (e.g. dependencies without a package.json file)
          const match = packageGraph.get(dependency);

          return (
            match &&
            FileSystemUtilities.existsSync(path.join(match.package.location, "package.json")) &&
            iteratedPackage.hasMatchingDependency(match.package)
          );
        });

      // actions to run for this package
      const packageActions = filteredDependencyNames.reduce((actions, dependencyName) => {
        // get Package of dependency
        const dependencyPackage = packageGraph.get(dependencyName).package;
        const depencyPath = path.join(iteratedPackage.nodeModulesLocation, dependencyPackage.name);

        // check if dependency is already installed
        if (FileSystemUtilities.existsSync(depencyPath)) {
          const isDepSymlink = FileSystemUtilities.isSymlink(depencyPath);

          // installed dependency is a symlink pointing to a different location
          if (isDepSymlink !== false && isDepSymlink !== dependencyPackage.location) {
            tracker.warn(
              "EREPLACE_OTHER",
              `Symlink already exists for ${dependencyName} dependency of ${iteratedPackage.name}, ` +
              "but links to different location. Replacing with updated symlink..."
            );
          // installed dependency is not a symlink
          } else if (isDepSymlink === false) {
            tracker.warn(
              "EREPLACE_EXIST",
              `${dependencyName} is already installed for ${iteratedPackage.name}. ` +
              "Replacing with symlink..."
            );
            // remove installed dependency
            actions.push((cb) => FileSystemUtilities.rimraf(depencyPath, cb));
          }
        }

        // ensure destination path
        actions.push((cb) => FileSystemUtilities.mkdirp(
          depencyPath.split(path.sep).slice(0, -1).join(path.sep), cb
        ));

        // create package symlink
        actions.push((cb) => FileSystemUtilities.symlink(
          dependencyPackage.location, depencyPath, "junction", cb
        ));

        // Create the symlinks for binaries of the iterated package dependency.
        const dependencyPackageJsonLocation = path.join(dependencyPackage.location, "package.json");
        const dependencyPackageJson = require(dependencyPackageJsonLocation);

        if (dependencyPackageJson.bin) {
          const destFolder = iteratedPackage.nodeModulesLocation;

          actions.push((cb) => {
            PackageUtilities.createBinaryLink(
              dependencyPackage.location,
              destFolder,
              dependencyName,
              dependencyPackageJson.bin,
              cb
            );
          });
        }

        return actions;
      }, []);

      return (cb) => {
        async.series(packageActions, (err) => {
          tracker.silly("packageActions", "finished", iteratedPackage.name);
          tracker.completeWork(1);
          cb(err);
        });
      };
    });

    async.series(actions, (err) => {
      tracker.finish();
      callback(err);
    });
  }

  /**
   * Create a symlink to a dependency's binary in the node_modules/.bin folder
   * @param {String} src
   * @param {String} dest
   * @param {String} name
   * @param {String|Object} bin
   * @param {Function} callback
   */
  static createBinaryLink(src, dest, name, bin, callback) {
    const safeName = name[0] === "@"
      ? name.substring(name.indexOf("/") + 1)
      : name;
    const destBinFolder = path.join(dest, ".bin");

    // The `bin` in a package.json may be either a string or an object.
    // Normalize to an object.
    const bins = typeof bin === "string"
      ? { [safeName]: bin }
      : bin;

    const srcBinFiles = [];
    const destBinFiles = [];
    Object.keys(bins).forEach((binName) => {
      srcBinFiles.push(path.join(src, bins[binName]));
      destBinFiles.push(path.join(destBinFolder, binName));
    });

    // make sure when have a destination folder (node_modules/.bin)
    const actions = [(cb) => FileSystemUtilities.mkdirp(destBinFolder, cb)];

    // symlink each binary
    srcBinFiles.forEach((binFile, idx) => {
      actions.push((cb) => FileSystemUtilities.symlink(binFile, destBinFiles[idx], "exec", cb));
    });

    async.series(actions, callback);
  }
}
