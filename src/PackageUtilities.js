import async from "async";
import glob from "glob";
import log from "npmlog";
import minimatch from "minimatch";
import path from "path";
import readPkg from "read-pkg";

import PackageGraph from "./PackageGraph";
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
      ignore: [
        // allow globs like "packages/**",
        // but avoid picking up node_modules/**/package.json
        "**/node_modules/**",
      ],
    };

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

      dependentPackages.push(pkg);
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
    async.parallel(batches.map((batch) => (cb) => {
      async.parallelLimit(batch.map(makeTask), concurrency, cb);
    }), callback);
  }
}
