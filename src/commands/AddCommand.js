"use strict";

const path = require("path");
const dedent = require("dedent");
const npa = require("npm-package-arg");
const packageJson = require("package-json");
const readPkg = require("read-pkg");
const semver = require("semver");
const writePkg = require("write-pkg");

const BootstrapCommand = require("./BootstrapCommand");
const Command = require("../Command");
const ValidationError = require("../utils/ValidationError");

exports.command = "add [pkgNames..]";

exports.describe = "Add dependencies to matched packages";

exports.builder = yargs =>
  yargs
    .options({
      dev: {
        describe: "Save to devDependencies",
      },
    })
    .positional("pkgNames", {
      describe: "One or more package names to add as a dependency",
      type: "string",
    });

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new AddCommand(argv);
};

class AddCommand extends Command {
  get requireGit() {
    return false;
  }

  initialize(callback) {
    const pkgs = this.options.pkgNames.map(input => {
      const { name, fetchSpec: versionRange } = npa(input);
      return { name, versionRange };
    });

    if (pkgs.length === 0) {
      const err = new ValidationError("EINPUT", "Missing list of packages to add to your project.");
      return callback(err);
    }

    const unsatisfied = pkgs
      .filter(pkg => this.packageExists(pkg.name))
      .filter(a => !this.packageSatisfied(a.name, a.versionRange))
      .map(u => ({
        name: u.name,
        versionRange: u.versionRange,
        version: this.getPackage(u.name).version,
      }));

    if (unsatisfied.length > 0) {
      const err = new ValidationError("ENOTSATISFIED", notSatisfiedMessage(unsatisfied));
      return callback(err);
    }

    this.dependencyType = this.options.dev ? "devDependencies" : "dependencies";

    Promise.all(
      pkgs.map(({ name, versionRange }) =>
        this.getPackageVersion(name, versionRange).then(version => ({ name, version, versionRange }))
      )
    )
      .then(packagesToInstall => {
        this.packagesToInstall = packagesToInstall;

        this.packagesToChange = this.filteredPackages
          // Skip packages that only would install themselves
          .filter(filteredPackage => {
            const notSamePackage = pkgToInstall => pkgToInstall.name !== filteredPackage.name;
            const addable = this.packagesToInstall.some(notSamePackage);
            if (!addable) {
              this.logger.warn(`Will not add ${filteredPackage.name} to itself.`);
            }
            return addable;
          })
          // Skip packages without actual changes to manifest
          .filter(filteredPackage => {
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

        if (this.packagesToChange.length === 0) {
          const packagesToInstallList = this.packagesToInstall.map(pkg => pkg.name).join(", ");
          this.logger.warn(`No packages found in scope where ${packagesToInstallList} can be added.`);
        }
      })
      .then(() => callback(null, this.packagesToChange.length > 0))
      .catch(callback);
  }

  execute(callback) {
    this.logger.info(`Add ${this.dependencyType} in ${this.packagesToChange.length} packages`);

    Promise.all(
      this.packagesToChange.map(pkgToChange => {
        const manifestPath = path.join(pkgToChange.location, "package.json");

        const notSamePackage = pkgToInstall => pkgToChange.name !== pkgToInstall.name;

        const applicable = this.packagesToInstall.filter(notSamePackage).reduce((obj, pkgToInstall) => {
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
      })
    )
      .then(pkgs => {
        const changedPkgs = pkgs.filter(p => p.changed);

        this.logger.info(`Changes require bootstrap in ${changedPkgs.length} packages`);

        const options = Object.assign({}, this.options, {
          args: [],
          cwd: this.repository.rootPath,
          scope: changedPkgs.map(p => p.name),
        });

        return BootstrapCommand.handler(options);
      })
      .then(() => callback())
      .catch(callback);
  }

  getPackage(name) {
    return this.packages.find(pkg => pkg.name === name);
  }

  getPackageVersion(name, versionRange) {
    if (this.packageSatisfied(name, versionRange)) {
      return Promise.resolve(this.getPackage(name).version);
    }
    return packageJson(name, { version: versionRange }).then(pkg => pkg.version);
  }

  packageExists(name) {
    return this.packages.some(pkg => pkg.name === name);
  }

  packageSatisfied(name, versionRange) {
    const pkg = this.getPackage(name);

    if (!pkg) {
      return false;
    }
    if (versionRange === "latest") {
      return true;
    }
    return semver.intersects(pkg.version, versionRange);
  }
}

function notSatisfiedMessage(unsatisfied) {
  return dedent`
    Requested range not satisfiable:
    ${unsatisfied.map(u => `${u.name}@${u.versionRange} (available: ${u.version})`).join(", ")}
  `;
}

function getRangeToReference(current, available, requested) {
  const resolved = requested === "latest" ? `^${available}` : requested;

  if (current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
