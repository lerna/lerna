// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { Command, getFilteredPackages, ValidationError, npmConf } from "@lerna/core";
import dedent from "dedent";
import npa from "npm-package-arg";
import pMap from "p-map";
import pacote from "pacote";
import path from "path";
import semver from "semver";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bootstrap = require("@lerna/commands/bootstrap");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getRangeToReference } = require("./lib/get-range-to-reference");

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new AddCommand(argv);
};

class AddCommand extends Command {
  get requiresGit() {
    return false;
  }

  get dependencyType() {
    if (this.options.dev) {
      return "devDependencies";
    }
    if (this.options.peer) {
      return "peerDependencies";
    }
    return "dependencies";
  }

  initialize() {
    if (this.options.npmClient === "pnpm") {
      throw new ValidationError(
        "EPNPMNOTSUPPORTED",
        "Add is not supported when using `pnpm` workspaces. Use `pnpm` directly to add dependencies to packages: https://pnpm.io/cli/add"
      );
    }

    this.spec = npa(this.options.pkg);
    this.dirs = new Set(this.options.globs.map((fp) => path.resolve(this.project.rootPath, fp)));
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
    chain = chain.then((version) => {
      if (version == null) {
        throw new ValidationError(
          "ENOTSATISFIED",
          dedent`
            Requested package has no version: ${this.spec.name}
          `
        );
      }
      this.spec.version = version;
    });

    chain = chain.then(() => getFilteredPackages(this.packageGraph, this.execOpts, this.options));
    chain = chain.then((filteredPackages) => {
      this.filteredPackages = filteredPackages;
    });

    chain = chain.then(() => this.collectPackagesToChange());
    chain = chain.then((packagesToChange) => {
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

    this.logger.info("", `Adding ${this.spec.name} in ${numberOfPackages}`);

    let chain = Promise.resolve();

    chain = chain.then(() => this.makeChanges());

    if (this.options.bootstrap !== false) {
      chain = chain.then(() => {
        const argv = Object.assign({}, this.options, {
          args: [],
          cwd: this.project.rootPath,
          // silence initial cli version logging, etc
          composed: "add",
          // NEVER pass filter-options, it is very bad
          scope: undefined,
          ignore: undefined,
          private: undefined,
          since: undefined,
          excludeDependents: undefined,
          includeDependents: undefined,
          includeDependencies: undefined,
        });

        return bootstrap(argv);
      });
    }

    return chain;
  }

  collectPackagesToChange() {
    const { name: targetName } = this.spec;
    let result = this.filteredPackages;

    // Skip packages that only would install themselves
    if (this.packageGraph.has(targetName)) {
      result = result.filter((pkg) => pkg.name !== targetName);
    }

    // Skip packages that are not selected by dir globs
    if (this.dirs.size) {
      result = result.filter((pkg) => this.dirs.has(pkg.location));
    }

    // Skip packages without actual changes to manifest
    result = result.filter((pkg) => {
      const deps = this.getPackageDeps(pkg);

      // Check if one of the packages to install necessitates a change to pkg's manifest
      if (!(targetName in deps)) {
        return true;
      }

      return getRangeToReference(this.spec, deps, pkg.location, this.savePrefix) !== deps[targetName];
    });

    return result;
  }

  makeChanges() {
    const { name: targetName } = this.spec;

    return pMap(this.packagesToChange, (pkg) => {
      const deps = this.getPackageDeps(pkg);
      const range = getRangeToReference(this.spec, deps, pkg.location, this.savePrefix);

      this.logger.verbose("add", `${targetName}@${range} to ${this.dependencyType} in ${pkg.name}`);
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
    if (this.selfSatisfied) {
      const node = this.packageGraph.get(this.spec.name);

      return Promise.resolve(this.spec.saveRelativeFileSpec ? node.location : node.version);
    }

    // @see https://github.com/zkat/pacote/blob/latest/lib/util/opt-check.js
    const opts = npmConf({
      includeDeprecated: false,
      // we can't pass everything, as our --scope conflicts with pacote's --scope
      registry: this.options.registry,
    });

    return pacote.manifest(this.spec, opts.snapshot).then((pkg) => pkg.version);
  }

  packageSatisfied() {
    const { name, fetchSpec } = this.spec;
    const pkg = this.packageGraph.get(name);

    if (!pkg) {
      return false;
    }

    // an explicit "file:packages/foo" always saves as a relative "file:../foo"
    if (this.spec.type === "directory" && fetchSpec === pkg.location) {
      this.spec.saveRelativeFileSpec = true;

      return true;
    }

    // existing relative file spec means local dep should be added the same way
    this.spec.saveRelativeFileSpec = Array.from(this.packageGraph.values()).some(
      (node) =>
        node.localDependencies.size &&
        Array.from(node.localDependencies.values()).some((resolved) => resolved.type === "directory")
    );

    if (fetchSpec === "latest") {
      return true;
    }

    return semver.intersects(pkg.version, fetchSpec);
  }
}

module.exports.AddCommand = AddCommand;
