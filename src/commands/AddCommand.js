import path from "path";
import dedent from "dedent";
import readPkg from "read-pkg";
import semver from "semver";
import writePkg from "write-pkg";
import BootstrapCommand from "./BootstrapCommand";
import Command, { ValidationError } from "../Command";

export const command = "add [args..]";

export const describe = "Add packages as dependency to matched packages";

export const builder = {
  dev: {
    describe: `Save as devDependency`
  },
};

export function handler(argv) {
  new AddCommand([...argv.args], argv, argv._cwd).run()
    .then(argv._onFinish, argv._onFinish);
}

export default class AddCommand extends Command {
  get requireGit() {
    return false;
  }

  initialize(callback) {
    const pkgs = this.input
      .filter(input => typeof input === 'string' && input.trim() !== '')
      .map(input => splitVersion(input) || [input, 'latest'])
      .filter(split => Array.isArray(split))
      .map(([name, versionRange = 'latest']) => ({name, versionRange}));

    if (pkgs.length === 0) {
      const err = new ValidationError("EINPUT", "Missing list of packages to add to your project.");
      return callback(err);
    }

    const missing = pkgs.filter(pkg => !this.packageExists(pkg.name));
    const available = pkgs.filter(pkg => this.packageExists(pkg.name));

    if (missing.length > 0) {
      const err = new ValidationError(
        "ENOTFOUND",
        notFoundMessage(missing, this.packages)
      );
      return callback(err);
    }

    const unsatisfied = available
      .filter(a => !this.packageSatisfied(a.name, a.versionRange))
      .map(u => ({
        name: u.name,
        versionRange: u.versionRange,
        version: this.getPackage(u.name).version
      }));

    if (unsatisfied.length > 0) {
      const err = new ValidationError(
        "ENOTSATISFIED",
        notSatisfiedMessage(unsatisfied)
      );
      return callback(err);
    }

    this.dependencyType = this.options.dev ? 'devDependencies' : 'dependencies';

    this.packagesToInstall = available
      .filter(a => this.packageSatisfied(a.name, a.versionRange))
      .map(a => {
        const pkg = this.getPackage(a.name);
        return {
          name: a.name,
          version: pkg.version,
          versionRange: a.versionRange
        }
      });

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
      const packagesToInstallList = this.packagesToInstall.map(pkg => pkg.name).join(', ');
      this.logger.warn(`No packages found in scope where ${packagesToInstallList} can be added.`);
    }

    callback(null, this.packagesToChange.length > 0);
  }

  execute(callback) {
    this.logger.info(`Add ${this.dependencyType} in ${this.packagesToChange.length} packages`);

    Promise.all(
      this.packagesToChange
        .map(pkgToChange => {
          const manifestPath = path.join(pkgToChange.location, "package.json");

          const notSamePackage = pkgToInstall => pkgToChange.name !== pkgToInstall.name;

          const applicable = this.packagesToInstall
            .filter(notSamePackage)
            .reduce((results, pkgToInstall) => {
              const deps = pkgToChange[this.dependencyType] || {};
              const current = deps[pkgToInstall.name];
              const range = getRangeToReference(
                current,
                pkgToInstall.version,
                pkgToInstall.versionRange
              );
              const id = `${pkgToInstall.name}@${range}`;
              const message = `Add ${id} as ${this.dependencyType} in ${pkgToChange.name}`;
              this.logger.verbose(message);
              results[pkgToInstall.name] = range;
              return results;
            }, {});

          const ammendment = {[this.dependencyType]: applicable};

          return readPkg(manifestPath, {normalize: false})
            .then(manifestJson => Object.assign({}, manifestJson, ammendment))
            .then(manifestJson => writePkg(manifestPath, manifestJson));
        })
      )
      .then(() => {
        this.logger.info(`Changes require bootstrap in ${this.packagesToChange.length} packages`);

        const options = Object.assign({}, this.options, {
          scope: this.packagesToChange.map(pkgToChange => pkgToChange.name)
        });

        return new BootstrapCommand([], options, this.repository.rootPath).run()
      })
      .then(() => callback())
      .catch(callback);
  }

  getPackage(name) {
    return this.packages.find(pkg => pkg.name === name);
  }

  packageExists(name) {
    return this.packages.some(pkg => pkg.name === name);
  }

  packageSatisfied(name, versionRange) {
    const pkg = this.getPackage(name);

    if (!pkg) {
      return false;
    }
    if (versionRange === 'latest') {
      return true;
    }
    return semver.intersects(pkg.version, versionRange);
  }
}

function notFoundMessage(missing, available) {
  return dedent`
    Packages not found: ${missing.map(m => m.name).join(', ')}.
    Available: ${available.map(m => m.name).join(', ')}
  `;
}

function notSatisfiedMessage(unsatisfied) {
  return dedent`
    Requested range not satisfiable:
    ${unsatisfied.map(u => `${u.name}@${u.versionRange} (available: ${u.version})`).join(', ')}
  `;
}

function splitVersion(dep) {
  return dep.match(/^(@?[^@]+)(?:@(.+))?/).slice(1, 3);
}

function getRangeToReference(current, available, requested) {
  const resolved = requested === 'latest'
    ? `^${available}`
    : requested;

  if (current && semver.intersects(current, resolved)) {
    return current;
  }

  return resolved;
}
