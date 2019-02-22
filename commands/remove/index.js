"use strict";

const path = require("path");
const pMap = require("p-map");
const fs = require("fs-extra");

const Command = require("@lerna/command");
const { getFilteredPackages } = require("@lerna/filter-options");
const npmUninstall = require("./utils/npm-uninstall");

module.exports = factory;

function factory(argv) {
  return new RemoveCommand(argv);
}

class RemoveCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    this.dependencyToRemove = this.options.pkg;

    this.dirs = new Set(this.options.globs.map(fp => path.resolve(this.project.rootPath, fp)));

    let chain = Promise.resolve();

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then(filteredPackages => {
      this.filteredPackages = filteredPackages;
    });

    chain = chain.then(() => this.collectPackagesToChange());
    chain = chain.then(packagesToChange => {
      this.packagesToChange = packagesToChange;
    });

    return chain.then(() => {
      const proceed = this.packagesToChange.length > 0;

      if (!proceed) {
        this.logger.warn(`No packages found where ${this.dependencyToRemove} can be removed.`);
      }

      return proceed;
    });
  }

  execute() {
    const numberOfPackages = `${this.packagesToChange.length} package${
      this.packagesToChange.length > 1 ? "s" : ""
    }`;

    this.logger.info("", `Remove ${this.dependencyToRemove} from ${numberOfPackages}`);

    let chain = Promise.resolve();

    chain = chain.then(() => this.removePackage());

    // if (this.options.bootstrap !== false) {
    //   chain = chain.then(() => {
    //     const argv = Object.assign({}, this.options, {
    //       args: [],
    //       cwd: this.project.rootPath,
    //       // silence initial cli version logging, etc
    //       composed: "add",
    //     });

    //     return bootstrap(argv);
    //   });
    // }

    return chain;
  }

  collectPackagesToChange() {
    let result = this.filteredPackages;

    // Skip packages that are not selected by dir globs
    if (this.dirs.size) {
      result = result.filter(pkg => this.dirs.has(pkg.location));
    }

    // Skip packages that has no such dependency
    result = result.filter(pkg => this.hasDependency(pkg));

    return result;
  }

  hasDependency(pkg) {
    return ["dependencies", "devDependencies", "peerDependencies"].some(dependencyType => {
      const deps = pkg.get(dependencyType);
      return deps && this.dependencyToRemove in deps;
    });
  }

  removePackage() {
    let chain = Promise.resolve();
    chain = chain.then(() => this.removeFromManifest());

    chain = chain.then(() => {
      const isDependencyToRemoveExternal = !this.packageGraph.has(this.dependencyToRemove);
      if (isDependencyToRemoveExternal) {
        return this.removeExternal();
      }
      return this.removeSymlink();
    });

    return chain;
  }

  removeFromManifest() {
    return pMap(this.packagesToChange, pkg => {
      if (pkg.dependencies) {
        delete pkg.dependencies[this.dependencyToRemove];
      }
      if (pkg.devDependencies) {
        delete pkg.devDependencies[this.dependencyToRemove];
      }
      if (pkg.peerDependencies) {
        delete pkg.peerDependencies[this.dependencyToRemove];
      }
      return pkg.serialize();
    });
  }

  removeSymlink() {
    this.logger.info("remove", `remove symlink`);
    return pMap(this.packagesToChange, pkg => {
      const dep = path.join(pkg.nodeModulesLocation, this.dependencyToRemove);
      if (fs.pathExists(dep)) {
        return fs.remove(dep);
      }
      return Promise.resolve();
    });
  }

  removeExternal() {
    this.logger.info("remove", `remove external`);
    return pMap(this.packagesToChange, pkg => {
      const dependencies = Array.from(this.packageGraph.get(pkg.name).externalDependencies.values()).map(
        res => res.toString()
      );
      return npmUninstall(pkg, dependencies, this.dependencyToRemove, this.options);
    });
  }
}

module.exports.RemoveCommand = RemoveCommand;
