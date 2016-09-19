import FileSystemUtilities from "./FileSystemUtilities";
import PackageGraph from "./PackageGraph";
import Package from "./Package";
import path from "path";
import {sync as globSync} from "glob";
import minimatch from "minimatch";

export default class PackageUtilities {
  static getGlobalVersion(versionPath) {
    if (FileSystemUtilities.existsSync(versionPath)) {
      return FileSystemUtilities.readFileSync(versionPath);
    }
  }

  static getPackagesPath(rootPath) {
    return path.join(rootPath, "packages");
  }

  static getPackagePath(packagesPath, name) {
    return path.join(packagesPath, name);
  }

  static getPackageConfigPath(packagesPath, name) {
    return path.join(PackageUtilities.getPackagePath(packagesPath, name), "package.json");
  }

  static getPackageConfig(packagesPath, name) {
    return require(PackageUtilities.getPackageConfigPath(packagesPath, name));
  }

  static getPackages(repository) {
    const packages = [];

    repository.packageConfigs.forEach(({glob}) => {

      globSync(glob)
        .map((fn) => path.resolve(fn))
        .forEach((packageConfigPath) => {
          const packagePath = path.dirname(packageConfigPath);

          if (!FileSystemUtilities.existsSync(packageConfigPath)) {
            return;
          }

          const packageJson = require(packageConfigPath);
          const pkg = new Package(packageJson, packagePath);

          packages.push(pkg);
        });
    });

    return packages;
  }

  static getPackageGraph(packages) {
    return new PackageGraph(packages);
  }

  /**
  * Filters a given set of packages and returns all packages that match the scope glob
  * and do not match the ignore glob
  *
  * @param {!Array.<Package>} packages The packages to filter
  * @param {Object} filters The scope and ignore filters.
  * @param {String} filters.scope glob The glob to match the package name against
  * @param {String} filters.ignore glob The glob to filter the package name against
  * @return {Array.<Package>} The packages with a name matching the glob
  */
  static filterPackages(packages, {scope, ignore}) {
    packages = packages.slice();
    if (scope) {
      packages = PackageUtilities._filterPackages(packages, scope);
    }
    if (ignore) {
      packages = PackageUtilities._filterPackages(packages, ignore, true);
    }
    return packages;
  }

  /**
  * Filters a given set of packages and returns all packages matching the given glob
  *
  * @param {!Array.<Package>} packages The packages to filter
  * @param {String} glob The glob to match the package name against
  * @param {Boolean} negate Negate glob pattern matches
  * @return {Array.<Package>} The packages with a name matching the glob
  * @throws in case a given glob would produce an empty list of packages
  */
  static _filterPackages(packages, glob, negate = false) {
    if (typeof glob !== "undefined") {
      packages = packages.filter((pkg) => {
        if (negate) {
          return !minimatch(pkg.name, glob);
        } else {
          return minimatch(pkg.name, glob);
        }
      });

      if (!packages.length) {
        throw new Error(`No packages found that match '${glob}'`);
      }
    } else {
      // Always return a copy.
      packages = packages.slice();
    }
    return packages;
  }

  static topologicallyBatchPackages(packagesToBatch, logger = null) {
    // We're going to be chopping stuff out of this array, so copy it.
    const packages = packagesToBatch.slice();
    const packageGraph = PackageUtilities.getPackageGraph(packages);

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
        if (logger) {
          logger.warn(
            "Encountered a cycle in the dependency graph. This may cause instability!"
          );
        }

        batch.push(packages.reduce((a, b) => (
          (refCounts[a.name] || 0) > (refCounts[b.name] || 0) ? a : b
        )));
      }

      batches.push(batch);

      batch.forEach((pkg) => {
        delete refCounts[pkg.name];
        packages.splice(packages.indexOf(pkg), 1);
      });
    }

    return batches;
  }
}
