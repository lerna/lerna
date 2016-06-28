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
    // Nothing to do...
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

    const ignore = this.flags.ignore || this.repository.bootstrapConfig.ignore;

    async.parallelLimit(PackageUtilities.filterPackages(this.packages, ignore, true).map(pkg => done => {
      async.series([
        cb => FileSystemUtilities.mkdirp(pkg.nodeModulesLocation, cb),
        cb => this.installExternalPackages(pkg, cb),
        cb => this.linkDependenciesForPackage(pkg, cb)
      ], err => {
        this.progressBar.tick(pkg.name);
        done(err);
      });
    }), this.concurrency, err => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  linkDependenciesForPackage(pkg, callback) {
    async.each(this.packages, (dependency, done) => {
      if (!this.hasMatchingDependency(pkg, dependency, true)) return done();

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
    const pkg = require(srcPackageJsonLocation);

    const packageJsonFileContents = JSON.stringify({
      name: name,
      version: pkg.version,
      main: pkg.main
    }, null, "  ");

    const prefix = this.repository.linkedFiles.prefix || "";
    const indexJsFileContents = prefix + "module.exports = require(" + JSON.stringify(src) + ");";

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
        const match = find(this.packages, pkg => {
          return pkg.name === dependency;
        });

        return !(match && this.hasMatchingDependency(pkg, match));
      })
      .filter(dependency => {
        return !this.hasDependencyInstalled(pkg, dependency);
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
        `Depends on "${dependency.name}@${expectedVersion}" ` +
        `instead of "${dependency.name}@${actualVersion}".`
      );
    }

    return false;
  }

  hasDependencyInstalled(pkg, dependency) {
    const packageJson = path.join(pkg.nodeModulesLocation, dependency, "package.json");
    try {
      return this.isCompatableVersion(
        require(packageJson).version,
        pkg.allDependencies[dependency]
      );
    } catch (e) {
      return false;
    }
  }

  isCompatableVersion(actual, expected) {
    return semver.satisfies(actual, expected);
  }
}
