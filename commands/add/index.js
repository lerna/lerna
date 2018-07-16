"use strict";

const dedent = require("dedent");
const npa = require("npm-package-arg");
const packageJson = require("package-json");
const pMap = require("p-map");
const path = require("path");
const semver = require("semver");

const Command = require("@lerna/command");
const bootstrap = require("@lerna/bootstrap");
const ValidationError = require("@lerna/validation-error");
const getRangeToReference = require("./lib/get-range-to-reference");

module.exports = factory;

function factory(argv) {
  return new AddCommand(argv);
}

class AddCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    this.dependencyType = this.options.dev ? "devDependencies" : "dependencies";
    this.spec = npa(this.options.pkg);
    this.dirs = new Set(this.options.globs.map(fp => path.resolve(this.project.rootPath, fp)));
    this.selfSatisfied = this.packageSatisfied();

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    if (this.packageGraph.has(this.spec.name) && !this.selfSatisfied) {
      const available = this.packageGraph.get(this.spec.name).version;

      throw new ValidationError(
        "ENOTSATISFIED",
        dedent`
          Requested range not satisfiable:
          ${this.spec.name}@${this.spec.fetchSpec} (available: ${available})
        `
      );
    }

    let chain = Promise.resolve();

    chain = chain.then(() => this.getPackageVersion());
    chain = chain.then(version => {
      this.spec.version = version;
    });

    chain = chain.then(() => this.collectPackagesToChange());
    chain = chain.then(packagesToChange => {
      this.packagesToChange = packagesToChange;
    });

    return chain.then(() => {
      const proceed = this.packagesToChange.length > 0;

      if (!proceed) {
        this.logger.warn(`No packages found where ${this.spec.name} can be added.`);
      }

      return proceed;
    });
  }

  execute() {
    const numberOfPackages = `${this.packagesToChange.length} package${
      this.packagesToChange.length > 1 ? "s" : ""
    }`;

    this.logger.info("add", `adding ${this.spec.name} in ${numberOfPackages}`);

    return this.makeChanges().then(() => {
      this.logger.info("add", `Bootstrapping ${numberOfPackages}`);

      return bootstrap(
        Object.assign({}, this.options, {
          args: [],
          cwd: this.project.rootPath,
          scope: this.packagesToChange.map(pkg => pkg.name),
        })
      );
    });
  }

  collectPackagesToChange() {
    const { name: targetName } = this.spec;
    let result = this.filteredPackages;

    // Skip packages that only would install themselves
    if (this.packageGraph.has(targetName)) {
      result = result.filter(pkg => pkg.name !== targetName);
    }

    // Skip packages that are not selected by dir globs
    if (this.dirs.size) {
      result = result.filter(pkg => this.dirs.has(pkg.location));
    }

    // Skip packages without actual changes to manifest
    result = result.filter(pkg => {
      const deps = this.getPackageDeps(pkg);

      // Check if one of the packages to install necessitates a change to pkg's manifest
      if (!(targetName in deps)) {
        return true;
      }

      return getRangeToReference(this.spec, deps, this.savePrefix) !== deps[targetName];
    });

    return result;
  }

  makeChanges() {
    const { name: targetName } = this.spec;

    return pMap(this.packagesToChange, pkg => {
      const deps = this.getPackageDeps(pkg);
      const range = getRangeToReference(this.spec, deps, this.savePrefix);

      this.logger.verbose("add", `${targetName}@${range} as ${this.dependencyType} in ${pkg.name}`);
      deps[targetName] = range;

      return pkg.serialize();
    });
  }

  getPackageDeps(pkg) {
    let deps = pkg.get(this.dependencyType);

    if (!deps) {
      deps = {};
      pkg.set(this.dependencyType, deps);
    }

    return deps;
  }

  getPackageVersion() {
    const { name, fetchSpec } = this.spec;

    if (this.selfSatisfied) {
      return Promise.resolve(this.packageGraph.get(name).version);
    }

    return packageJson(name, { version: fetchSpec }).then(pkg => pkg.version);
  }

  packageSatisfied() {
    const { name, fetchSpec } = this.spec;
    const pkg = this.packageGraph.get(name);

    if (!pkg) {
      return false;
    }

    if (fetchSpec === "latest") {
      return true;
    }

    return semver.intersects(pkg.version, fetchSpec);
  }
}

module.exports.AddCommand = AddCommand;
