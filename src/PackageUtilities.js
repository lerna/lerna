"use strict";

const async = require("async");
const globby = require("globby");
const log = require("npmlog");
const minimatch = require("minimatch");
const { entries } = require("lodash");
const path = require("path");
const readPkg = require("read-pkg");

const PackageGraph = require("./PackageGraph");
const FileSystemUtilities = require("./FileSystemUtilities");
const Package = require("./Package");
const ValidationError = require("./utils/ValidationError");

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

function isHoistedPackage(name, hoist, nohoist) {
  return filterPackage(name, hoist) && filterPackage(name, nohoist, true);
}

function getPackages({ packageConfigs, rootPath }) {
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
    globby.sync(path.join(globPath, "package.json"), globOpts).forEach(globResult => {
      // https://github.com/isaacs/node-glob/blob/master/common.js#L104
      // glob always returns "\\" as "/" in windows, so everyone
      // gets normalized because we can't have nice things.
      const packageConfigPath = path.normalize(globResult);
      const packageDir = path.dirname(packageConfigPath);
      const packageJson = readPkg.sync(packageConfigPath, { normalize: false });
      packages.push(new Package(packageJson, packageDir, rootPath));
    });
  });

  return packages;
}

// a convenient wrapper around the underlying constructor
function getPackageGraph(packages, { graphType = "allDependencies", forceLocal } = {}) {
  return new PackageGraph(packages, { graphType, forceLocal });
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
function addDependencies(packages, packageGraph) {
  // the current list of packages we are expanding using breadth-first-search
  const search = new Set(packages.map(({ name }) => name).map(name => packageGraph.get(name)));

  // an intermediate list of matched PackageGraphNodes
  const result = [];

  search.forEach(currentNode => {
    // anything searched for is always a result
    result.push(currentNode);

    currentNode.localDependencies.forEach((meta, depName) => {
      const depNode = packageGraph.get(depName);

      if (depNode !== currentNode && !search.has(depNode)) {
        search.add(depNode);
      }
    });
  });

  // actual Package instances, not PackageGraphNodes
  return result.map(node => node.pkg);
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
function filterPackages(packagesToFilter, { scope, ignore }) {
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

function validatePackageNames(packages) {
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

function batchPackages(packagesToBatch, { graphType, rejectCycles } = {}) {
  // create a new graph because we will be mutating it
  const graph = exports.getPackageGraph(packagesToBatch, { graphType });
  const [cyclePaths, cycleNodes] = graph.partitionCycles();
  const batches = [];

  if (cyclePaths.size) {
    const cycleMessage = ["Dependency cycles detected, you should fix these!"]
      .concat(Array.from(cyclePaths).map(cycle => cycle.join(" -> ")))
      .join("\n");

    if (rejectCycles) {
      throw new ValidationError("ECYCLE", cycleMessage);
    }

    log.warn("ECYCLE", cycleMessage);
  }

  while (graph.size) {
    // pick the current set of nodes _without_ localDependencies (aka it is a "source" node)
    const batch = Array.from(graph.values()).filter(node => node.is("source"));

    log.silly("batched", batch);
    // batches are composed of Package instances, not PackageGraphNodes
    batches.push(batch.map(node => node.pkg));

    // pruning the graph changes the node.is("source") evaluation
    graph.prune(...batch);
  }

  if (cycleNodes.size) {
    // isolate cycles behind a single-package batch of the cyclical package with the most dependents
    const [king, ...rats] = Array.from(cycleNodes)
      .sort((a, b) => b.localDependents.size - a.localDependents.size)
      .map(node => node.pkg);

    batches.push([king]);
    batches.push(rats);
  }

  return batches;
}

function runParallelBatches(batches, makeTask, concurrency, callback) {
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
        exports.createBinaryLink(dependencyNode.pkg, currentNode.pkg, next);
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

/**
 * Symlink bins of srcPackage to node_modules/.bin in destPackage
 * @param {Object|string} srcPackageRef
 * @param {Object|string} destPackageRef
 * @param {Function} callback
 */
function createBinaryLink(srcPackageRef, destPackageRef, callback) {
  const srcPackage = resolvePackageRef(srcPackageRef);
  const destPackage = resolvePackageRef(destPackageRef);

  const actions = entries(srcPackage.bin)
    .map(([name, file]) => ({
      src: path.join(srcPackage.location, file),
      dst: path.join(destPackage.binLocation, name),
    }))
    .filter(({ src }) => FileSystemUtilities.existsSync(src))
    .map(({ src, dst }) => cb =>
      async.series(
        [
          next => FileSystemUtilities.symlink(src, dst, "exec", next),
          done => FileSystemUtilities.chmod(src, "755", done),
        ],
        cb
      )
    );

  if (actions.length === 0) {
    return callback();
  }

  const ensureBin = cb => FileSystemUtilities.mkdirp(destPackage.binLocation, cb);
  const linkEntries = cb => async.parallel(actions, cb);

  async.series([ensureBin, linkEntries], callback);
}

function resolvePackageRef(pkgRef) {
  if (pkgRef instanceof Package) {
    return pkgRef;
  }

  return new Package(readPkg.sync(pkgRef), pkgRef);
}

exports.isHoistedPackage = isHoistedPackage;
exports.getPackages = getPackages;
exports.getPackageGraph = getPackageGraph;
exports.addDependencies = addDependencies;
exports.filterPackages = filterPackages;
exports.validatePackageNames = validatePackageNames;
exports.batchPackages = batchPackages;
exports.runParallelBatches = runParallelBatches;
exports.symlinkPackages = symlinkPackages;
exports.createBinaryLink = createBinaryLink;
