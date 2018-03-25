"use strict";

const dedent = require("dedent");
const npa = require("npm-package-arg");
const packageJson = require("package-json");
const pMap = require("p-map");
const semver = require("semver");
const writePkg = require("write-pkg");

const BootstrapCommand = require("@lerna/bootstrap/command");
const Command = require("@lerna/command");
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
    this.specs = this.options.pkgNames.map(input => npa(input));

    if (this.specs.length === 0) {
      throw new ValidationError("EINPUT", "Missing list of packages to add to your project.");
    }

    const unsatisfied = this.specs
      .filter(spec => this.packageGraph.has(spec.name))
      .filter(spec => !this.packageSatisfied(spec))
      .map(({ name, fetchSpec }) => ({
        name,
        fetchSpec,
        version: this.packageGraph.get(name).version,
      }));

    if (unsatisfied.length > 0) {
      throw new ValidationError(
        "ENOTSATISFIED",
        dedent`
          Requested range not satisfiable:
          ${unsatisfied.map(u => `${u.name}@${u.versionRange} (available: ${u.version})`).join(", ")}
        `
      );
    }

    let chain = Promise.resolve();

    chain = chain.then(() => this.collectInstallSpecs());
    chain = chain.then(installSpecs => {
      this.installSpecs = installSpecs;
    });

    chain = chain.then(() => this.collectPackagesToChange());
    chain = chain.then(packagesToChange => {
      this.packagesToChange = packagesToChange;
    });

    return chain.then(() => {
      const proceed = this.packagesToChange.length > 0;

      if (!proceed) {
        this.logger.warn(
          `No packages found in scope where ${this.installSpecs
            .map(spec => spec.name)
            .join(", ")} can be added.`
        );
      }

      return proceed;
    });
  }

  execute() {
    this.logger.info(`Add ${this.dependencyType} in ${this.packagesToChange.length} packages`);

    return this.makeChanges().then(pkgs => {
      this.logger.info(`Changes require bootstrap in ${pkgs.length} packages`);

      return BootstrapCommand.handler(
        Object.assign({}, this.options, {
          args: [],
          cwd: this.project.rootPath,
          scope: pkgs,
        })
      );
    });
  }

  collectInstallSpecs() {
    return pMap(
      this.specs,
      spec => this.getPackageVersion(spec).then(version => Object.assign(spec, { version })),
      { concurrency: this.concurrency }
    );
  }

  collectPackagesToChange() {
    let result = this.filteredPackages;

    // Skip packages that only would install themselves
    result = result.filter(pkg => this.installSpecs.some(spec => spec.name !== pkg.name));

    // Skip packages without actual changes to manifest
    result = result.filter(pkg => {
      const deps = this.getPackageDeps(pkg);

      // Check if one of the packages to install necessitates a change to pkg's manifest
      return this.installSpecs.filter(spec => spec.name !== pkg.name).some(spec => {
        if (!(spec.name in deps)) {
          return true;
        }

        return getRangeToReference(spec, deps) !== deps[spec.name];
      });
    });

    return result;
  }

  makeChanges() {
    const mapper = pkg => {
      const deps = this.getPackageDeps(pkg);

      for (const spec of this.installSpecs) {
        if (spec.name !== pkg.name) {
          const range = getRangeToReference(spec, deps);

          this.logger.verbose(`Add ${spec.name}@${range} as ${this.dependencyType} in ${pkg.name}`);
          deps[spec.name] = range;
        }
      }

      return writePkg(pkg.manifestLocation, pkg.toJSON()).then(() => pkg.name);
    };

    return pMap(this.packagesToChange, mapper);
  }

  getPackageDeps(pkg) {
    if (!pkg.json[this.dependencyType]) {
      pkg.json[this.dependencyType] = {};
    }

    return pkg.json[this.dependencyType];
  }

  getPackageVersion(spec) {
    if (this.packageSatisfied(spec)) {
      return Promise.resolve(this.packageGraph.get(spec.name).version);
    }

    return packageJson(spec.name, { version: spec.fetchSpec }).then(pkg => pkg.version);
  }

  packageSatisfied(spec) {
    const pkg = this.packageGraph.get(spec.name);

    if (!pkg) {
      return false;
    }

    if (spec.fetchSpec === "latest") {
      return true;
    }

    return semver.intersects(pkg.version, spec.fetchSpec);
  }
}

module.exports.AddCommand = AddCommand;
