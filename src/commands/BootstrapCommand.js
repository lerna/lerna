import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
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

    async.parallelLimit(this.packages.map(pkg => done => {
      async.series([
        cb => FileSystemUtilities.mkdirp(pkg.nodeModulesLocation, cb),
        cb => this.installExternalPackages(pkg, cb),
        cb => this.linkDependenciesForPackage(pkg, cb)
      ], err => {
        this.progressBar.tick(pkg.name);
        done(err);
      });
    }), 4, err => {
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
    const destModuleJsLocation = path.join(dest, "module.js");
    const pkg = require(srcPackageJsonLocation);

    const newPkgJson = {
      name: name,
      version: pkg.version,
      main: "index.js"
    };

    if (pkg["jsnext:main"]) { // support jsnext:main convention for ES modules
      newPkgJson["jsnext:main"] = "module.js";
    }

    const packageJsonFileContents = JSON.stringify(newPkgJson, null, "  ");
    const indexJsFileContents = "module.exports = require(" + JSON.stringify(src) + ");";
    const moduleJsFileContents = "export * from " + JSON.stringify(src) + ";";

    async.parallel([
      callback => {
        FileSystemUtilities.writeFile(destPackageJsonLocation, packageJsonFileContents, callback);
      }, callback => {
        FileSystemUtilities.writeFile(destModuleJsLocation, moduleJsFileContents, callback);
      }, callback => {
        FileSystemUtilities.writeFile(destIndexJsLocation, indexJsFileContents, callback);
      }],
    callback);
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
