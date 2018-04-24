import async from "async";
import glob from "glob";
import log from "npmlog";
import minimatch from "minimatch";
import { entries } from "lodash";
import path from "path";
import readPkg from "read-pkg";

import PackageGraph from "./PackageGraph";
import FileSystemUtilities from "./FileSystemUtilities";
import Package from "./Package";

/**
 * A predicate that determines if a given package name satisfies a glob.
 *
 * @param {!String} name The package name
 * @param {String|Array<String>} filters The glob (or globs) to match a package name against
 * @param {Boolean} negate Negate glob pattern matches
 * @return {Boolean} The packages with a name matching the glob
 */
function filterPackage(name, filters, negate) {
  // If there isn't a filter then we can just return the package.
  if (!filters) {
    return true;
  }

  // Include/exlude with no arguments implies splat.
  // For example: `--hoist` is equivalent to `--hoist=**`.
  // The double star here is to account for scoped packages.
  if (filters === true) {
    filters = "**"; // eslint-disable-line no-param-reassign
  }

  if (!Array.isArray(filters)) {
    filters = [filters]; // eslint-disable-line no-param-reassign
  }

  if (negate) {
    return filters.every(pattern => !minimatch(name, pattern));
  }
  return filters.some(pattern => minimatch(name, pattern));
}

export default class PackageUtilities {
  static isHoistedPackage(name, hoist, nohoist) {
    return filterPackage(name, hoist) && filterPackage(name, nohoist, true);
  }

  static getPackages({ packageConfigs, rootPath }) {
    const packages = [];
    const globOpts = {
      cwd: rootPath,
      strict: true,
      absolute: true,
    };

    const hasNodeModules = packageConfigs.some(cfg => cfg.indexOf("node_modules") > -1);
    const hasGlobStar = packageConfigs.some(cfg => cfg.indexOf("**") > -1);

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

    packageConfigs.forEach(globPath => {
      glob.sync(path.join(globPath, "package.json"), globOpts).forEach(globResult => {
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

  static getPackageGraph(packages, depsOnly, versionParser) {
    return new PackageGraph(packages, depsOnly, versionParser);
  }

  /**
   * Takes a list of Packages and returns a list of those same Packages with any Packages
   * that depend on them. i.e if packageC depended on packageD
   * `PackageUtilities.addDependents([packageD], this.packageGraph)`
   * would return [packageC, packageD]
   * @param {!Array.<Package>} packages The packages to include dependencies for.
   * @param {!<PackageGraph>} packageGraph The package graph for the whole repository.
   * @return {Array.<Package>} The packages with any dependencies that were't already included.
   */
  static addDependents(packages, packageGraph) {
    return PackageUtilities.extendList(packages, packageGraph, "localDependents");
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
    return PackageUtilities.extendList(packages, packageGraph, "dependencies");
  }

  static extendList(packages, packageGraph, propertyName) {
    const result = [];

    const packageNodes = packages.map(pkg => packageGraph.get(pkg.name));

    // the current list of packages we are expanding using breadth-first-search
    const fringe = packageNodes.slice();
    const packageExistsInRepository = packageName => !!packageGraph.get(packageName);
    const packageAlreadyFound = packageName => result.some(node => node.package.name === packageName);
    const packageInFringe = packageName => fringe.some(node => node.package.name === packageName);

    while (fringe.length !== 0) {
      const node = fringe.shift();

      node[propertyName].forEach(dep => {
        if (packageExistsInRepository(dep) && !packageAlreadyFound(dep) && !packageInFringe(dep)) {
          fringe.push(packageGraph.get(dep));
        }
      });

      if (!packageAlreadyFound(node.package.name)) {
        result.push(node);
      }
    }

    return result.map(node => node.package);
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
      packages = packages.filter(pkg => filterPackage(pkg.name, scope));

      if (!packages.length) {
        throw new Error(`No packages found that match scope '${scope}'`);
      }
    }

    if (ignore) {
      packages = packages.filter(pkg => filterPackage(pkg.name, ignore, true));

      if (!packages.length) {
        throw new Error(`No packages remain after ignoring '${ignore}'`);
      }
    }

    return packages;
  }

  static filterPackagesThatAreNotUpdated(packagesToFilter, packageUpdates) {
    return packageUpdates
      .map(update => update.package)
      .filter(pkg => packagesToFilter.some(p => p.name === pkg.name));
  }

  static validatePackageNames(packages) {
    const existingPackageNames = {};

    packages.forEach(pkg => {
      if (!existingPackageNames[pkg.name]) {
        existingPackageNames[pkg.name] = [];
      }

      existingPackageNames[pkg.name].push(pkg.location);
    });

    Object.keys(existingPackageNames).forEach(pkgName => {
      if (existingPackageNames[pkgName].length > 1) {
        log.warn(
          `Package name "${pkgName}" used in multiple packages:
          \t${existingPackageNames[pkgName].join("\n\t")}`
        );
      }
    });
  }

  static topologicallyBatchPackages(packagesToBatch, { depsOnly, rejectCycles } = {}) {
    // We're going to be chopping stuff out of this array, so copy it.
    const packages = packagesToBatch.slice();
    const packageGraph = PackageUtilities.getPackageGraph(packages, depsOnly);

    // This maps package names to the number of packages that depend on them.
    // As packages are completed their names will be removed from this object.
    const refCounts = {};
    packages.forEach(pkg =>
      packageGraph.get(pkg.name).dependencies.forEach(dep => {
        if (!refCounts[dep]) {
          refCounts[dep] = 0;
        }
        refCounts[dep] += 1;
      })
    );

    const batches = [];
    while (packages.length) {
      // Get all packages that have no remaining dependencies within the repo
      // that haven't yet been picked.
      const batch = packages.filter(pkg => {
        const node = packageGraph.get(pkg.name);
        return node.dependencies.filter(dep => refCounts[dep]).length === 0;
      });

      // If we weren't able to find a package with no remaining dependencies,
      // then we've encountered a cycle in the dependency graph.  Run a
      // single-package batch with the package that has the most dependents.
      if (packages.length && !batch.length) {
        const cyclePackageNames = packages.map(p => `"${p.name}"`);
        const message = `${"Encountered a cycle in the dependency graph." +
          "This may cause instability! Packages in cycle are: "}${cyclePackageNames.join(", ")}`;

        if (rejectCycles) {
          throw new Error(message);
        }
        log.warn("ECYCLE", message);

        batch.push(packages.reduce((a, b) => ((refCounts[a.name] || 0) > (refCounts[b.name] || 0) ? a : b)));

        log.silly("packages", batch.map(pkg => pkg.name));
      }

      batches.push(batch);

      batch.forEach(pkg => {
        delete refCounts[pkg.name];
        packages.splice(packages.indexOf(pkg), 1);
      });
    }

    return batches;
  }

  static runParallelBatches(batches, makeTask, concurrency, callback) {
    async.series(
      batches.map(batch => cb => {
        async.parallelLimit(batch.map(makeTask), concurrency, cb);
      }),
      callback
    );
  }

  /**
   * Symlink all packages to the packages/node_modules directory
   * Symlink package binaries to dependent packages' node_modules/.bin directory
   * @param {Array.<Package>} packages
   * @param {Object} packageGraph
   * @param {Object} logger
   * @param {Function} callback
   */
  static symlinkPackages(packages, packageGraph, logger, forceLocal, callback) {
    const tracker = logger.newItem("symlink packages");

    tracker.info("", "Symlinking packages and binaries");
    tracker.addWork(packages.length);

    const actions = packages.map(iteratedPackage => {
      const filteredDependencyNames = Object.keys(iteratedPackage.allDependencies).filter(dependency => {
        // Filter out external dependencies and incompatible packages
        // (e.g. dependencies without a package.json file)
        const match = packageGraph.get(dependency);

        return (
          match &&
          FileSystemUtilities.existsSync(path.join(match.package.location, "package.json")) &&
          (forceLocal || iteratedPackage.hasMatchingDependency(match.package))
        );
      });

      // actions to run for this package
      const packageActions = filteredDependencyNames.reduce((acc, dependencyName) => {
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
            acc.push(cb => FileSystemUtilities.rimraf(depencyPath, cb));
          }
        }

        // ensure destination path
        acc.push(cb =>
          FileSystemUtilities.mkdirp(
            depencyPath
              .split(path.sep)
              .slice(0, -1)
              .join(path.sep),
            cb
          )
        );

        // create package symlink
        acc.push(cb => {
          FileSystemUtilities.symlink(dependencyPackage.location, depencyPath, "junction", cb);
        });

        acc.push(cb => {
          PackageUtilities.createBinaryLink(dependencyPackage, iteratedPackage, cb);
        });

        return acc;
      }, []);

      return cb => {
        async.series(packageActions, err => {
          tracker.silly("packageActions", "finished", iteratedPackage.name);
          tracker.completeWork(1);
          cb(err);
        });
      };
    });

    async.series(actions, err => {
      tracker.finish();
      callback(err);
    });
  }

  /**
   * Symlink bins of srcPackage to node_modules/.bin in destPackage
   * @param {Object|string} srcPackageRef
   * @param {Object|string} destPackageRef
   * @param {Function} callback
   */
  static createBinaryLink(srcPackageRef, destPackageRef, callback) {
    const srcPackage = resolvePackageRef(srcPackageRef);
    const destPackage = resolvePackageRef(destPackageRef);

    const bin = getPackageBin(srcPackageRef);

    const actions = entries(bin)
      .map(([name, file]) => ({
        src: path.join(srcPackage.location, file),
        dst: path.join(destPackage.binLocation, name),
      }))
      .reduce((acc, { src, dst }) => {
        const link = cb => FileSystemUtilities.symlink(src, dst, "exec", cb);
        const chmod = cb => FileSystemUtilities.chmod(src, "755", cb);
        const linkActions = FileSystemUtilities.existsSync(src) ? [link, chmod] : [];

        acc.push(cb => async.series(linkActions, cb));
        return acc;
      }, []);

    if (actions.length === 0) {
      return callback();
    }

    const ensureBin = cb => FileSystemUtilities.mkdirp(destPackage.binLocation, cb);
    const linkEntries = cb => async.parallel(actions, cb);

    async.series([ensureBin, linkEntries], callback);
  }
}

function getPackageBin(pkgRef) {
  const pkg = resolvePackageRef(pkgRef);
  const name = getSafeName(pkg.name);

  return typeof pkg.bin === "string" ? { [name]: pkg.bin } : pkg.bin || {};
}

function getSafeName(rawName) {
  return rawName[0] === "@" ? rawName.substring(rawName.indexOf("/") + 1) : rawName;
}

function resolvePackageRef(pkgRef) {
  return pkgRef instanceof Package ? pkgRef : new Package(readPkg.sync(pkgRef), pkgRef);
}
