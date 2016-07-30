import FileSystemUtilities from "./FileSystemUtilities";
import PackageGraph from "./PackageGraph";
import Package from "./Package";
import path from "path";
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

  static getPackages(packagesPath) {
    const packages = [];

    FileSystemUtilities.readdirSync(packagesPath).forEach((packageDirectory) => {
      if (packageDirectory[0] === ".") {
        return;
      }

      const packagePath = PackageUtilities.getPackagePath(packagesPath, packageDirectory);
      const packageConfigPath = PackageUtilities.getPackageConfigPath(packagesPath, packageDirectory);

      if (!FileSystemUtilities.existsSync(packageConfigPath)) {
        return;
      }

      const packageJson = require(packageConfigPath);
      const pkg = new Package(packageJson, packagePath);

      packages.push(pkg);
    });

    return packages;
  }

  static getPackageGraph(packages) {
    return new PackageGraph(packages);
  }

  /**
  * Filters a given set of packages and returns the one matching the given glob
  *
  * @param {!Array.<Package>} packages The packages to filter
  * @param {String} glob The glob to match the package name against
  * @param {Boolean} negate Negate glob pattern matches
  * @return {Array.<Package>} The packages with a name matching the glob
  * @throws in case a given glob would produce an empty list of packages
  */
  static filterPackages(packages, glob, negate = false) {
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
}
