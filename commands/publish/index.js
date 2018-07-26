"use strict";

const os = require("os");
const path = require("path");
const pFinally = require("p-finally");
const pMap = require("p-map");
const pReduce = require("p-reduce");
const semver = require("semver");

const Command = require("@lerna/command");
const childProcess = require("@lerna/child-process");
const output = require("@lerna/output");
const collectUpdates = require("@lerna/collect-updates");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const { createRunner } = require("@lerna/run-lifecycle");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const versionCommand = require("@lerna/version");

const createTempLicenses = require("./lib/create-temp-licenses");
const getCurrentSHA = require("./lib/get-current-sha");
const getCurrentTags = require("./lib/get-current-tags");
const getTaggedPackages = require("./lib/get-tagged-packages");
const getPackagesWithoutLicense = require("./lib/get-packages-without-license");
const gitCheckout = require("./lib/git-checkout");
const removeTempLicenses = require("./lib/remove-temp-licenses");

module.exports = factory;

function factory(argv) {
  return new PublishCommand(argv);
}

class PublishCommand extends Command {
  get otherCommandConfigs() {
    // back-compat
    return ["version"];
  }

  initialize() {
    if (this.options.skipNpm) {
      this.logger.warn("deprecated", "Instead of --skip-npm, call `lerna version` directly");

      return versionCommand(this._argv).then(() => false);
    }

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (this.options.requireScripts) {
      this.logger.info("require-scripts", "enabled");
    }

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    this.npmConfig = {
      npmClient: this.options.npmClient || "npm",
      registry: this.options.registry,
    };

    return Promise.resolve(this.findVersionedUpdates()).then(result => {
      if (!result) {
        // early return from nested VersionCommand
        return false;
      }

      if (!result.updates.length) {
        this.logger.success("No updated packages to publish");

        // still exits zero, aka "ok"
        return false;
      }

      this.updates = result.updates;
      this.updatesVersions = new Map(result.updatesVersions);

      this.runPackageLifecycle = createRunner(this.options);
      this.packagesToPublish = this.updates.map(({ pkg }) => pkg).filter(pkg => !pkg.private);
      this.batchedPackages = this.toposort
        ? batchPackages(
            this.packagesToPublish,
            this.options.rejectCycles,
            // Don't sort based on devDependencies because that would increase the chance of dependency cycles
            // causing less-than-ideal a publishing order.
            "dependencies"
          )
        : [this.packagesToPublish];

      let chain = Promise.resolve();

      // prepare for license management
      chain = chain.then(() => getPackagesWithoutLicense(this.project, this.packagesToPublish));
      chain = chain.then(packagesWithoutLicense => {
        if (packagesWithoutLicense.length && !this.project.licensePath) {
          this.packagesToBeLicensed = [];
          this.logger.warn(
            "ENOLICENSE",
            `Packages ${packagesWithoutLicense.map(pkg => pkg.name).join(", ")} are missing a license`
          );
        } else {
          this.packagesToBeLicensed = packagesWithoutLicense;
        }
      });

      return chain;
    });
  }

  execute() {
    this.enableProgressBar();
    this.logger.info("publish", "Publishing packages to npm...");

    let chain = Promise.resolve();

    if (this.options.canary) {
      chain = chain.then(() => this.updateCanaryVersions());
    }

    chain = chain.then(() => this.resolveLocalDependencyLinks());
    chain = chain.then(() => this.annotateGitHead());
    chain = chain.then(() => this.npmPublish());
    chain = chain.then(() => this.resetChanges());

    if (this.options.tempTag) {
      chain = chain.then(() => this.npmUpdateAsLatest());
    }

    return chain.then(() => {
      const count = this.packagesToPublish.length;
      const message = this.packagesToPublish.map(pkg => ` - ${pkg.name}@${pkg.version}`);

      output("Successfully published:");
      output(message.join(os.EOL));

      this.logger.success("published", "%d %s", count, count === 1 ? "package" : "packages");
    });
  }

  findVersionedUpdates() {
    if (this.options.bump === "from-git") {
      return this.detectFromGit();
    }

    if (this.options.canary) {
      // TODO: throw useful error when canary attempted on tagged release?
      return this.detectCanaryVersions();
    }

    return versionCommand(this._argv);
  }

  detectFromGit() {
    let chain = Promise.resolve();

    chain = chain.then(() => getCurrentTags(this.execOpts));
    chain = chain.then(taggedPackageNames => {
      if (!taggedPackageNames.length) {
        this.logger.notice("from-git", "No tagged release found");

        return [];
      }

      if (this.project.isIndependent()) {
        return taggedPackageNames.map(name => this.packageGraph.get(name));
      }

      return getTaggedPackages(this.packageGraph, this.project.rootPath, this.execOpts);
    });

    return chain.then(updates => {
      const updatesVersions = updates.map(({ pkg }) => [pkg.name, pkg.version]);

      return { updates, updatesVersions };
    });
  }

  detectCanaryVersions() {
    const { bump = "prepatch", preid = "alpha" } = this.options;
    // "prerelease" and "prepatch" are identical, for our purposes
    const release = bump.startsWith("pre") ? bump.replace("release", "patch") : `pre${bump}`;

    let chain = Promise.resolve();

    // find changed packages since last release, if any
    chain = chain.then(() =>
      collectUpdates(this.filteredPackages, this.packageGraph, this.execOpts, {
        bump: "prerelease",
        canary: true,
        ignoreChanges: this.options.ignoreChanges,
      })
    );

    const makeVersion = described => {
      // FIXME: this will blow up when `described` doesn't match the regex (returns null)
      const [, baseVersion, refCount, buildMeta] = /^(?:.*@)?(.*)-(\d+)-g([0-9a-f]+)$/.exec(described);

      // the next version is bumped without concern for preid or current index
      const nextVersion = semver.inc(baseVersion, release.replace("pre", ""));

      // semver.inc() starts a new prerelease at .0, git describe starts at .1
      // and build metadata is always ignored when comparing dependency ranges
      return `${nextVersion}-${preid}.${refCount - 1}+${buildMeta}`;
    };

    const gitDescribeMatching = globFilter =>
      childProcess.execSync("git", ["describe", "--match", globFilter], this.execOpts);

    if (this.project.isIndependent()) {
      // each package is described against its tags only
      chain = chain.then(updates =>
        pMap(updates, ({ pkg }) => {
          const described = gitDescribeMatching(`${pkg.name}@*`);
          const version = makeVersion(described);

          return [pkg.name, version];
        }).then(updatesVersions => ({ updates, updatesVersions }))
      );
    } else {
      // all packages are described against the last tag
      chain = chain.then(updates => {
        const described = gitDescribeMatching(`${this.options.tagVersionPrefix}*.*.*`);
        const version = makeVersion(described);
        const updatesVersions = updates.map(({ pkg }) => [pkg.name, version]);

        return { updates, updatesVersions };
      });
    }

    return chain;
  }

  updateCanaryVersions() {
    const publishableUpdates = this.updates.filter(node => !node.pkg.private);

    return pMap(publishableUpdates, ({ pkg, localDependencies }) => {
      pkg.version = this.updatesVersions.get(pkg.name);

      for (const [depName, resolved] of localDependencies) {
        // other canary versions need to be updated, non-canary is a no-op
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in annotateGitHead()
    });
  }

  resolveLocalDependencyLinks() {
    // resolve relative file: links to their actual version range
    const updatesWithLocalLinks = this.updates.filter(
      ({ pkg, localDependencies }) =>
        !pkg.private &&
        localDependencies.size &&
        Array.from(localDependencies.values()).some(({ type }) => type === "directory")
    );

    return pMap(updatesWithLocalLinks, ({ pkg, localDependencies }) => {
      for (const [depName, resolved] of localDependencies) {
        // regardless of where the version comes from, we can't publish "file:../sibling-pkg" specs
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in annotateGitHead()
    });
  }

  annotateGitHead() {
    const gitHead = getCurrentSHA(this.execOpts);

    return pMap(this.packagesToPublish, pkg => {
      // provide gitHead property that is normally added during npm publish
      pkg.set("gitHead", gitHead);

      return pkg.serialize();
    });
  }

  resetChanges() {
    // the package.json files are changed (by gitHead if not --canary)
    // and we should always leave the working tree clean
    return pReduce(this.project.packageConfigs, (_, pkgGlob) =>
      gitCheckout(`${pkgGlob}/package.json`, this.execOpts)
    ).then(() =>
      // --skip-git should not leave unstaged changes behind
      gitCheckout(this.project.manifest.location, this.execOpts)
    );
  }

  execScript(pkg, script) {
    const scriptLocation = path.join(pkg.location, "scripts", script);

    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(scriptLocation);
    } catch (ex) {
      this.logger.silly("execScript", `No ${script} script found at ${scriptLocation}`);
    }
  }

  runPrepublishScripts(pkg) {
    return Promise.resolve()
      .then(() => this.runPackageLifecycle(pkg, "prepare"))
      .then(() => this.runPackageLifecycle(pkg, "prepublishOnly"));
  }

  removeTempLicensesOnError(error) {
    return Promise.resolve()
      .then(() =>
        removeTempLicenses(this.packagesToBeLicensed).catch(removeError => {
          this.logger.error(
            "licenses",
            "error removing temporary license files",
            removeError.stack || removeError
          );
        })
      )
      .then(() => {
        // restore original error into promise chain
        throw error;
      });
  }

  npmPublish() {
    const tracker = this.logger.newItem("npmPublish");
    // if we skip temp tags we should tag with the proper value immediately
    const distTag = this.options.tempTag ? "lerna-temp" : this.getDistTag();

    let chain = Promise.resolve();

    chain = chain.then(() => createTempLicenses(this.project.licensePath, this.packagesToBeLicensed));

    chain = chain.then(() => this.runPrepublishScripts(this.project.manifest));
    chain = chain.then(() =>
      pMap(this.updates, ({ pkg }) => {
        if (this.options.requireScripts) {
          this.execScript(pkg, "prepublish");
        }

        return this.runPrepublishScripts(pkg);
      })
    );

    tracker.addWork(this.packagesToPublish.length);

    const mapPackage = pkg => {
      tracker.verbose("publishing", pkg.name);

      return npmPublish(pkg, distTag, this.npmConfig).then(() => {
        tracker.info("published", pkg.name);
        tracker.completeWork(1);

        if (this.options.requireScripts) {
          this.execScript(pkg, "postpublish");
        }

        return this.runPackageLifecycle(pkg, "postpublish");
      });
    };

    chain = chain.then(() => runParallelBatches(this.batchedPackages, this.concurrency, mapPackage));
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "postpublish"));
    chain = chain.then(() => removeTempLicenses(this.packagesToBeLicensed));

    // remove temporary license files if _any_ error occurs _anywhere_ in the promise chain
    chain = chain.catch(error => this.removeTempLicensesOnError(error));

    return pFinally(chain, () => tracker.finish());
  }

  npmUpdateAsLatest() {
    const tracker = this.logger.newItem("npmUpdateAsLatest");

    tracker.addWork(this.packagesToPublish.length);

    const mapPackage = pkg =>
      this.updateTag(pkg).then(() => {
        tracker.info("latest", pkg.name);
        tracker.completeWork(1);
      });

    return pFinally(runParallelBatches(this.batchedPackages, this.concurrency, mapPackage), () =>
      tracker.finish()
    );
  }

  removeTempTag(pkg) {
    return Promise.resolve()
      .then(() => npmDistTag.check(pkg, "lerna-temp", this.npmConfig.registry))
      .then(exists => {
        if (exists) {
          return npmDistTag.remove(pkg, "lerna-temp", this.npmConfig.registry);
        }
      });
  }

  updateTag(pkg) {
    const distTag = this.getDistTag() || "latest";
    const version = this.options.canary ? pkg.version : this.updatesVersions.get(pkg.name);

    return this.removeTempTag(pkg).then(() => npmDistTag.add(pkg, version, distTag, this.npmConfig.registry));
  }

  getDistTag() {
    if (this.options.npmTag) {
      return this.options.npmTag;
    }

    if (this.options.canary) {
      return "canary";
    }

    // undefined defaults to "latest" OR whatever is in pkg.publishConfig.tag
  }
}

module.exports.PublishCommand = PublishCommand;
