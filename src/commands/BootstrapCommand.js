import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
import semver from "semver";
import async from "async";
import find from "lodash.find";
import path from "path";

export default class BootstrapCommand extends Command {
  initialize(callback) {
    this.rootPackages = PackageUtilities.getPackages(this.repository.nodeModulesLocation);
    callback(null, true);
  }

  execute(callback) {
    this.linkDependencies(err => {
      if (err) {
        callback(err);
      } else {
        this.logger.success("Successfully bootstrapped " + this.packages.length + " packages.");
        callback(null, true);
      }
    });
  }

  linkDependencies(callback) {
    this.progressBar.init(this.packages.length);
    this.logger.info("Linking all dependencies");

    async.parallelLimit(this.packages.map(pkg => done => {
      async.series([
        cb => FileSystemUtilities.mkdirp(pkg.nodeModulesLocation, cb),
        cb => this.installExternalPackages(pkg, cb),
        cb => this.linkExternalDependenciesForPackage(pkg, cb),
        cb => this.linkInternalDependenciesForPackage(pkg, cb)
      ], err => {
        this.progressBar.tick(pkg.name);
        done(err);
      });
    }), this.concurrency, err => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  linkInternalDependenciesForPackage(pkg, callback) {
    this.linkDependenciesForPackage(pkg, this.packages, true, callback);
  }

  linkExternalDependenciesForPackage(pkg, callback) {
    this.linkDependenciesForPackage(pkg, this.rootPackages, false, callback);
  }

  linkDependenciesForPackage(pkg, dependencies, showWarning, callback) {
    async.each(dependencies, (dependency, done) => {
      if (!this.hasMatchingDependency(pkg, dependency, showWarning)) {
        return done();
      }

      const linkSrc = dependency.location;
      const linkDest = path.join(pkg.nodeModulesLocation, dependency.name);

      this.createLinkedDependency(linkSrc, linkDest, dependency.name, done);
    }, callback);
  }

  createLinkedDependency(src, dest, name, callback) {
    FileSystemUtilities.rimraf(dest, err => {
      if (err) {
        return callback(err);
      }

      FileSystemUtilities.mkdirp(dest, err => {
        if (err) {
          return callback(err);
        }

        this.createLinkedDependencyFiles(src, dest, name, callback);
      });
    });
  }

  createLinkedDependencyFiles(src, dest, name, callback) {
    const srcPackageJsonLocation = path.join(src, "package.json");
    const destPackageJsonLocation = path.join(dest, "package.json");
    const destIndexJsLocation = path.join(dest, "index.js");

    const packageJsonFileContents = JSON.stringify({
      name: name,
      version: require(srcPackageJsonLocation).version
    }, null, "  ");

    const indexJsFileContents = "module.exports = require(" + JSON.stringify(src) + ");";

    FileSystemUtilities.writeFile(destPackageJsonLocation, packageJsonFileContents, err => {
      if (err) {
        return callback(err);
      }

      FileSystemUtilities.writeFile(destIndexJsLocation, indexJsFileContents, callback);
    });
  }

  installExternalPackages(pkg, callback) {
    const allDependencies = pkg.allDependencies;

    const externalPackages = Object.keys(allDependencies)
      .filter(dependency => {
        const internalMatch = find(this.packages, pkg => {
          return pkg.name === dependency;
        });
        const externalMatch = find(this.rootPackages, pkg => {
          return pkg.name === dependency;
        });

        return !(
          (internalMatch && this.hasMatchingDependency(pkg, internalMatch)) ||
          (externalMatch && this.hasMatchingDependency(pkg, externalMatch))
        );
      })
      .map(dependency => {
        return dependency + "@" + allDependencies[dependency];
      });

    if (externalPackages.length) {
      NpmUtilities.installInDir(pkg.location, externalPackages, callback);
    } else {
      callback();
    }
  }

  hasMatchingDependency(pkg, dependency, showWarning = false) {
    const expectedVersion = pkg.allDependencies[dependency.name];
    const actualVersion = dependency.version;

    if (!expectedVersion) {
      return false;
    }

    if (this.isCompatableVersion(actualVersion, expectedVersion)) {
      return true;
    }

    if (showWarning) {
      this.logger.warning(
        `Version mismatch inside "${pkg.name}". ` +
        `Depends on "${dependency.name}@${actualVersion}" ` +
        `instead of "${dependency.name}@${expectedVersion}".`
      );
    }

    return false;
  }

  isCompatableVersion(actual, expected) {
    return semver.satisfies(actual, expected);
  }
}
