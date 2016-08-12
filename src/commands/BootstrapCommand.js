import FileSystemUtilities from "../FileSystemUtilities";
import NpmUtilities from "../NpmUtilities";
import PackageUtilities from "../PackageUtilities";
import Command from "../Command";
import semver from "semver";
import async from "async";
import find from "lodash.find";
import path from "path";
import normalize from "normalize-path";

export default class BootstrapCommand extends Command {
  initialize(callback) {
    // Nothing to do...
    callback(null, true);
  }

  execute(callback) {
    this.linkDependencies((err) => {
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

    // Get a filtered list of packages that will be bootstrapped.
    const todoPackages = PackageUtilities.filterPackages(this.packages, ignore, true);

    // Get a trimmed down graph that includes only those packages.
    const filteredGraph = PackageUtilities.getPackageGraph(todoPackages);

    // This maps package names to the number of packages that depend on them.
    // As packages are completed their names will be removed from this object.
    const pendingDeps = {};
    todoPackages.forEach((pkg) => filteredGraph.get(pkg.name).dependencies.forEach((dep) => {
      if (!pendingDeps[dep]) pendingDeps[dep] = 0;
      pendingDeps[dep]++;
    }));

    // Bootstrap runs the "prepublish" script in each package.  This script
    // may _use_ another package from the repo.  Therefore if a package in the
    // repo depends on another we need to bootstrap the dependency before the
    // dependent.  So the bootstrap proceeds in batches of packages where each
    // batch includes all packages that have no remaining un-bootstrapped
    // dependencies within the repo.
    const bootstrapBatch = () => {

      // Get all packages that have no remaining dependencies within the repo
      // that haven't yet been bootstrapped.
      const batch = todoPackages.filter((pkg) => {
        const node = filteredGraph.get(pkg.name);
        return !node.dependencies.filter((dep) => pendingDeps[dep]).length;
      });

      // If we weren't able to find a package with no remaining dependencies,
      // then we've encountered a cycle in the dependency graph.  Run a
      // single-package batch with the package that has the most dependents.
      if (todoPackages.length && !batch.length) {
        this.logger.warning(
          "Encountered a cycle in the dependency graph.  " +
          "This may cause instability if dependencies are used during `prepublish`."
        );
        batch.push(todoPackages.reduce((a, b) => (
          (pendingDeps[a.name] || 0) > (pendingDeps[b.name] || 0) ? a : b
        )));
      }

      async.parallelLimit(batch.map((pkg) => (done) => {
        async.series([
          (cb) => FileSystemUtilities.mkdirp(pkg.nodeModulesLocation, cb),
          (cb) => this.installExternalPackages(pkg, cb),
          (cb) => this.linkDependenciesForPackage(pkg, cb),
          (cb) => this.linkBinariesForPackage(pkg, cb),
          (cb) => this.runPrepublishForPackage(pkg, cb),
        ], (err) => {
          this.progressBar.tick(pkg.name);
          delete pendingDeps[pkg.name];
          todoPackages.splice(todoPackages.indexOf(pkg), 1);
          done(err);
        });
      }), this.concurrency, (err) => {
        if (todoPackages.length && !err) {
          bootstrapBatch();
        } else {
          this.progressBar.terminate();
          callback(err);
        }
      });
    };

    // Kick off the first batch.
    bootstrapBatch();
  }

  runPrepublishForPackage(pkg, callback) {
    if ((pkg.scripts || {}).prepublish) {
      NpmUtilities.runScriptInDir("prepublish", [], pkg.location, callback);
    } else {
      callback();
    }
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
    FileSystemUtilities.rimraf(dest, (err) => {
      if (err) {
        return callback(err);
      }

      FileSystemUtilities.mkdirp(dest, (err) => {
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

    const prefix = this.repository.linkedFiles.prefix || "";
    const indexJsFileContents = prefix + "module.exports = require(" +  JSON.stringify(normalize(src)) + ");";

    FileSystemUtilities.writeFile(destPackageJsonLocation, packageJsonFileContents, (err) => {
      if (err) {
        return callback(err);
      }

      FileSystemUtilities.writeFile(destIndexJsLocation, indexJsFileContents, callback);
    });
  }

  linkBinariesForPackage(pkg, callback) {
    const actions = this.packages
      .filter((dep) => this.hasMatchingDependency(pkg, dep) && dep.bin)
      .map((dep) => (cb) => this.createBinaryLink(pkg, dep, cb));

    async.parallelLimit(actions, this.concurrency, callback);
  }

  createBinaryLink(pkg, dep, callback) {
    const dest = path.join(pkg.nodeModulesLocation, ".bin");

    // The `bin` in a package.json may be either a string or an object.
    // Normalize to an object.
    const bins = typeof dep.bin === "string"
      ? { [dep.name]: dep.bin }
      : dep.bin;

    async.series([(cb) => FileSystemUtilities.mkdirp(dest, cb)].concat(
      Object.keys(bins).map((name) => (cb) => FileSystemUtilities.symlink(
        path.join(dep.location, bins[name]),
        path.join(dest, name),
        cb
      ))
    ), callback);
  }

  installExternalPackages(pkg, callback) {
    const allDependencies = pkg.allDependencies;

    const externalPackages = Object.keys(allDependencies)
      .filter((dependency) => {
        const match = find(this.packages, (pkg) => {
          return pkg.name === dependency;
        });

        return !(match && this.hasMatchingDependency(pkg, match));
      })
      .filter((dependency) => {
        return !this.hasDependencyInstalled(pkg, dependency);
      })
      .map((dependency) => {
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
