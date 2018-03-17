"use strict";

const path = require("path");
const npa = require("npm-package-arg");
const packageJson = require("package-json");
const readPkg = require("read-pkg");
const semver = require("semver");
const writePkg = require("write-pkg");

const BootstrapCommand = require("@lerna/bootstrap/command");
const Command = require("@lerna/command");
const ValidationError = require("@lerna/validation-error");
const getRangeToReference = require("./lib/get-range-to-reference");
const notSatisfiedMessage = require("./lib/not-satisfied-message");

class AddCommand extends Command {
  get requiresGit() {
    return false;
  }

  initialize() {
    this.dependencyType = this.options.dev ? "devDependencies" : "dependencies";
    this.targetPackages = this.options.pkgNames.map(input => {
      const { name, fetchSpec: versionRange } = npa(input);

      return { name, versionRange };
    });

    if (this.targetPackages.length === 0) {
      throw new ValidationError("EINPUT", "Missing list of packages to add to your project.");
    }

    const unsatisfied = this.targetPackages
      .filter(pkg => this.packageGraph.has(pkg.name))
      .filter(a => !this.packageSatisfied(a.name, a.versionRange))
      .map(u => ({
        name: u.name,
        versionRange: u.versionRange,
        version: this.packageGraph.get(u.name).version,
      }));

    if (unsatisfied.length > 0) {
      throw new ValidationError("ENOTSATISFIED", notSatisfiedMessage(unsatisfied));
    }

    let chain = Promise.resolve();

    chain = chain.then(() => this.collectPackagesToInstall());
    chain = chain.then(packagesToInstall => {
      this.packagesToInstall = packagesToInstall;
    });

    chain = chain.then(() => this.collectPackagesToChange());
    chain = chain.then(packagesToChange => {
      this.packagesToChange = packagesToChange;
    });

    return chain.then(() => {
      const proceed = this.packagesToChange.length > 0;

      if (!proceed) {
        const packagesToInstallList = this.packagesToInstall.map(pkg => pkg.name).join(", ");

        this.logger.warn(`No packages found in scope where ${packagesToInstallList} can be added.`);
      }

      return proceed;
    });
  }

  execute() {
    this.logger.info(`Add ${this.dependencyType} in ${this.packagesToChange.length} packages`);

    return this.makeChanges().then(pkgs => {
      const changedPkgs = pkgs.filter(p => p.changed);

      this.logger.info(`Changes require bootstrap in ${changedPkgs.length} packages`);

      const options = Object.assign({}, this.options, {
        args: [],
        cwd: this.repository.rootPath,
        scope: changedPkgs.map(p => p.name),
      });

      return BootstrapCommand.handler(options);
    });
  }

  collectPackagesToInstall() {
    const mapper = ({ name, versionRange }) =>
      this.getPackageVersion(name, versionRange).then(version => ({ name, version, versionRange }));

    return Promise.all(this.targetPackages.map(mapper));
  }

  collectPackagesToChange() {
    let result = this.filteredPackages;

    // Skip packages that only would install themselves
    result = result.filter(filteredPackage => {
      const addable = this.packagesToInstall.some(pkgToInstall => pkgToInstall.name !== filteredPackage.name);

      if (!addable) {
        this.logger.warn(`Will not add ${filteredPackage.name} to itself.`);
      }

      return addable;
    });

    // Skip packages without actual changes to manifest
    result = result.filter(filteredPackage => {
      const deps = filteredPackage[this.dependencyType] || {};

      // Check if one of the packages to install necessiates a change to filteredPackage's manifest
      return this.packagesToInstall
        .filter(pkgToInstall => pkgToInstall.name !== filteredPackage.name)
        .some(pkgToInstall => {
          if (!(pkgToInstall.name in deps)) {
            return true;
          }

          const current = deps[pkgToInstall.name];
          const range = getRangeToReference(current, pkgToInstall.version, pkgToInstall.versionRange);

          return range !== current;
        });
    });

    return result;
  }

  makeChanges() {
    const mapper = pkgToChange => {
      const manifestPath = path.join(pkgToChange.location, "package.json");

      const applicable = this.packagesToInstall
        .filter(pkgToInstall => pkgToChange.name !== pkgToInstall.name)
        .reduce((obj, pkgToInstall) => {
          const deps = pkgToChange[this.dependencyType] || {};
          const current = deps[pkgToInstall.name];
          const range = getRangeToReference(current, pkgToInstall.version, pkgToInstall.versionRange);

          this.logger.verbose(
            `Add ${pkgToInstall.name}@${range} as ${this.dependencyType} in ${pkgToChange.name}`
          );

          obj[pkgToInstall.name] = range;

          return obj;
        }, {});

      return readPkg(manifestPath, { normalize: false })
        .then(a => {
          const previous = a[this.dependencyType] || {};
          const payload = Object.assign({}, previous, applicable);
          const ammendment = { [this.dependencyType]: payload };

          const b = Object.assign({}, a, ammendment);
          return { a, b };
        })
        .then(({ a, b }) => {
          const changed = JSON.stringify(a) !== JSON.stringify(b);
          const exec = changed ? () => writePkg(manifestPath, b) : () => Promise.resolve();

          return exec().then(() => ({
            name: pkgToChange.name,
            changed,
          }));
        });
    };

    return Promise.all(this.packagesToChange.map(mapper));
  }

  getPackageVersion(name, versionRange) {
    if (this.packageSatisfied(name, versionRange)) {
      return Promise.resolve(this.packageGraph.get(name).version);
    }

    return packageJson(name, { version: versionRange }).then(pkg => pkg.version);
  }

  packageSatisfied(name, versionRange) {
    const pkg = this.packageGraph.get(name);

    if (!pkg) {
      return false;
    }

    if (versionRange === "latest") {
      return true;
    }

    return semver.intersects(pkg.version, versionRange);
  }
}

module.exports = AddCommand;
