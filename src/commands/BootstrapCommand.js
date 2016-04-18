import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import async from "async";
import find from "lodash.find";
import path from "path";

export default class BootstrapCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback();
  }

  execute() {
    this.linkDependencies(this.flags, (err, packages) => {
      if (err) {
        this.logger.error("Errored while bootstrapping packages.", err);
        this.exit(1);
      } else {
        this.logger.success("Successfully bootstrapped " + packages.length + " packages.");
        this.exit(0);
      }
    });
  }

  linkDependencies(flags, callback) {
    this.progressBar.init(this.packages.length);
    this.logger.info("Linking all dependencies");

    async.parallelLimit(this.packages.map(pkg => done => {
      async.series([
        cb => FileSystemUtilities.mkdirp(pkg.nodeModulesLocation, cb),
        cb => this.installExternalPackages(pkg, cb),
        cb => this.linkDependenciesForPackage(pkg, flags, cb)
      ], err => {
        this.progressBar.tick(pkg.name)
        done(err);
      });
    }), 4, err => {
      this.progressBar.terminate();
      if (err) {
        this.logger.error("Errored while linking all dependencies", err);
      } else {
        this.logger.success("Successfully linked all dependencies");
      }
      callback(err);
    });
  }

  linkDependenciesForPackage(pkg, callback) {
    async.each(this.pkgs, (dependency, done) => {
      if (!this.hasMatchingDependency(pkg, dependency)) return done();

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
    const dependencies = pkg.dependencies;

    const externalPackages = Object.keys(dependencies)
      .filter(dependency => {
        const match = find(this.packages, pkg => {
          return pkg.name === dependency;
        });

        return !(match && this.hasMatchingDependency(pkg, match));
      })
      .map(dependency => {
        return dependency + "@" + dependencies[dependency];
      });

    if (externalPackages.length) {
      NpmUtilities.installInDir(pkg.location, externalPackages, callback);
    } else {
      callback();
    }
  }

  hasMatchingDependency(pkg, dependency) {
    const version = pkg.dependencies[dependency.name];

    if (!version) {
      return false;
    }

    if (version[0] !== "^" || version[1] !== dependency.version[0]) {
      return false;
    }

    return true;
  }
}
