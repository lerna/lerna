"use strict";

const os = require("os");
const path = require("path");
const pFinally = require("p-finally");
const pMap = require("p-map");
const pPipe = require("p-pipe");
const pReduce = require("p-reduce");
const semver = require("semver");
const getAuth = require("npm-registry-fetch/auth");

const Command = require("@lerna/command");
const describeRef = require("@lerna/describe-ref");
const checkWorkingTree = require("@lerna/check-working-tree");
const PromptUtilities = require("@lerna/prompt");
const output = require("@lerna/output");
const collectUpdates = require("@lerna/collect-updates");
const npmConf = require("@lerna/npm-conf");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const { createRunner } = require("@lerna/run-lifecycle");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const versionCommand = require("@lerna/version");

const createTempLicenses = require("./lib/create-temp-licenses");
const getCurrentSHA = require("./lib/get-current-sha");
const getCurrentTags = require("./lib/get-current-tags");
const getNpmUsername = require("./lib/get-npm-username");
const getTaggedPackages = require("./lib/get-tagged-packages");
const getPackagesWithoutLicense = require("./lib/get-packages-without-license");
const gitCheckout = require("./lib/git-checkout");
const removeTempLicenses = require("./lib/remove-temp-licenses");
const verifyNpmPackageAccess = require("./lib/verify-npm-package-access");

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
      // TODO: remove in next major release
      this.logger.warn("deprecated", "Instead of --skip-npm, call `lerna version` directly");

      return versionCommand(this._argv).then(() => false);
    }

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (this.options.requireScripts) {
      this.logger.info("require-scripts", "enabled");
    }

    // inverted boolean options
    this.verifyAccess = this.options.verifyAccess !== false;

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    this.conf = npmConf({
      log: this.logger,
      registry: this.options.registry,
    });

    if (this.conf.get("registry") === "https://registry.yarnpkg.com") {
      this.logger.warn("", "Yarn's registry proxy is broken, replacing with public npm registry");
      this.logger.warn("", "If you don't have an npm token, you should exit and run `npm login`");

      this.conf.set("registry", "https://registry.npmjs.org/", "cli");
    }

    // all consumers need a token
    const registry = this.conf.get("registry");
    const auth = getAuth(registry, this.conf);

    if (auth.token) {
      this.conf.set("token", auth.token, "cli");
    }

    this.npmConfig = {
      npmClient: this.options.npmClient || "npm",
      registry: this.conf.get("registry"),
    };

    let chain = Promise.resolve();

    // validate user has valid npm credentials first,
    // by far the most common form of failed execution
    chain = chain.then(() => getNpmUsername(this.conf));
    chain = chain.then(username => {
      // username is necessary for subsequent access check
      this.conf.add({ username }, "cmd");
    });
    chain = chain.then(() => this.findVersionedUpdates());

    return chain.then(result => {
      if (!result) {
        // early return from nested VersionCommand
        return false;
      }

      if (!result.updates.length) {
        this.logger.success("No changed packages to publish");

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
            // Don't sort based on devDependencies because that
            // would increase the chance of dependency cycles
            // causing less-than-ideal a publishing order.
            "dependencies"
          )
        : [this.packagesToPublish];

      if (result.needsConfirmation) {
        // only confirm for --canary or bump === "from-git",
        // as VersionCommand has its own confirmation prompt
        return this.confirmPublish();
      }

      return true;
    });
  }

  execute() {
    this.enableProgressBar();
    this.logger.info("publish", "Publishing packages to npm...");

    let chain = Promise.resolve();

    chain = chain.then(() => this.prepareRegistryActions());
    chain = chain.then(() => this.prepareLicenseActions());

    if (this.options.canary) {
      chain = chain.then(() => this.updateCanaryVersions());
    }

    chain = chain.then(() => this.resolveLocalDependencyLinks());
    chain = chain.then(() => this.annotateGitHead());
    chain = chain.then(() => this.packUpdated());
    chain = chain.then(() => this.publishPacked());
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
    let chain = Promise.resolve();

    if (this.options.bump === "from-git") {
      chain = chain.then(() => this.detectFromGit());
    } else if (this.options.canary) {
      chain = chain.then(() => this.detectCanaryVersions());
    } else {
      chain = chain.then(() => versionCommand(this._argv));
    }

    return chain;
  }

  verifyWorkingTreeClean() {
    return describeRef(this.execOpts).then(checkWorkingTree.throwIfUncommitted);
  }

  detectFromGit() {
    let chain = Promise.resolve();

    // attempting to publish a tagged release with local changes is not allowed
    chain = chain.then(() => this.verifyWorkingTreeClean());

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

      return {
        updates,
        updatesVersions,
        needsConfirmation: true,
      };
    });
  }

  detectCanaryVersions() {
    const {
      bump = "prepatch",
      preid = "alpha",
      tagVersionPrefix = "v",
      ignoreChanges,
      forcePublish,
    } = this.options;
    // "prerelease" and "prepatch" are identical, for our purposes
    const release = bump.startsWith("pre") ? bump.replace("release", "patch") : `pre${bump}`;

    let chain = Promise.resolve();

    // attempting to publish a canary release with local changes is not allowed
    chain = chain.then(() => this.verifyWorkingTreeClean());

    // find changed packages since last release, if any
    chain = chain.then(() =>
      collectUpdates(this.packageGraph.rawPackageList, this.packageGraph, this.execOpts, {
        bump: "prerelease",
        canary: true,
        ignoreChanges,
        forcePublish,
      })
    );

    const makeVersion = ({ lastVersion, refCount, sha }) => {
      // the next version is bumped without concern for preid or current index
      const nextVersion = semver.inc(lastVersion, release.replace("pre", ""));

      // semver.inc() starts a new prerelease at .0, git describe starts at .1
      // and build metadata is always ignored when comparing dependency ranges
      return `${nextVersion}-${preid}.${Math.max(0, refCount - 1)}+${sha}`;
    };

    if (this.project.isIndependent()) {
      // each package is described against its tags only
      chain = chain.then(updates =>
        pMap(updates, ({ pkg }) =>
          describeRef({
            match: `${pkg.name}@*`,
            cwd: this.execOpts.cwd,
          })
            .then(({ lastVersion = pkg.version, refCount, sha }) =>
              // an unpublished package will have no reachable git tag
              makeVersion({ lastVersion, refCount, sha })
            )
            .then(version => [pkg.name, version])
        ).then(updatesVersions => ({
          updates,
          updatesVersions,
        }))
      );
    } else {
      // all packages are described against the last tag
      chain = chain.then(updates =>
        describeRef({
          match: `${tagVersionPrefix}*.*.*`,
          cwd: this.execOpts.cwd,
        })
          .then(makeVersion)
          .then(version => updates.map(({ pkg }) => [pkg.name, version]))
          .then(updatesVersions => ({
            updates,
            updatesVersions,
          }))
      );
    }

    return chain.then(({ updates, updatesVersions }) => ({
      updates,
      updatesVersions,
      needsConfirmation: true,
    }));
  }

  confirmPublish() {
    const count = this.packagesToPublish.length;
    const message = this.packagesToPublish.map(
      pkg => ` - ${pkg.name} => ${this.updatesVersions.get(pkg.name)}`
    );

    output("");
    output(`Found ${count} ${count === 1 ? "package" : "packages"} to publish:`);
    output(message.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }

    return PromptUtilities.confirm("Are you sure you want to publish these packages?");
  }

  prepareLicenseActions() {
    return Promise.resolve()
      .then(() => getPackagesWithoutLicense(this.project, this.packagesToPublish))
      .then(packagesWithoutLicense => {
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
  }

  prepareRegistryActions() {
    let chain = Promise.resolve();

    /* istanbul ignore if */
    if (process.env.LERNA_INTEGRATION) {
      return chain;
    }

    // if no username was retrieved, don't bother validating
    if (this.conf.get("username") && this.verifyAccess) {
      chain = chain.then(() => verifyNpmPackageAccess(this.packagesToPublish, this.conf));
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

    return pkg;
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

  packUpdated() {
    const tracker = this.logger.newItem("npm pack");

    tracker.addWork(this.packagesToPublish.length);

    let chain = Promise.resolve();

    chain = chain.then(() => {
      this.npmPack = npmPublish.makePacker(this.project.manifest);
    });

    chain = chain.then(() => createTempLicenses(this.project.licensePath, this.packagesToBeLicensed));

    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepare"));
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepublishOnly"));
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepack"));

    const actions = [
      pkg =>
        // npm pack already runs prepare and prepublish
        // prepublishOnly is _not_ run when publishing a tarball
        // TECHNICALLY out of order, but not much we can do about that
        this.runPackageLifecycle(pkg, "prepublishOnly"),
    ];

    if (this.options.requireScripts) {
      actions.push(pkg => this.execScript(pkg, "prepublish"));
    }

    const mapper = pPipe(actions);

    chain = chain.then(() =>
      pReduce(this.batchedPackages, (_, batch) =>
        pMap(batch, mapper)
          .then(() => this.npmPack(batch))
          .then(() => {
            tracker.completeWork(batch.length);
          })
      )
    );

    chain = chain.then(() => removeTempLicenses(this.packagesToBeLicensed));

    // remove temporary license files if _any_ error occurs _anywhere_ in the promise chain
    chain = chain.catch(error => this.removeTempLicensesOnError(error));

    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "postpack"));

    return pFinally(chain, () => tracker.finish());
  }

  publishPacked() {
    // if we skip temp tags we should tag with the proper value immediately
    const distTag = this.options.tempTag ? "lerna-temp" : this.getDistTag();
    const tracker = this.logger.newItem(`${this.npmConfig.npmClient} publish`);

    tracker.addWork(this.packagesToPublish.length);

    let chain = Promise.resolve();

    const actions = [
      pkg => npmPublish(pkg, distTag, this.npmConfig),
      // postpublish is _not_ run when publishing a tarball
      pkg => this.runPackageLifecycle(pkg, "postpublish"),
    ];

    if (this.options.requireScripts) {
      actions.push(pkg => this.execScript(pkg, "postpublish"));
    }

    actions.push(pkg => {
      tracker.info("published", pkg.name, pkg.version);
      tracker.completeWork(1);

      return pkg;
    });

    const mapper = pPipe(actions);

    chain = chain.then(() => runParallelBatches(this.batchedPackages, this.concurrency, mapper));

    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "postpublish"));

    return pFinally(chain, () => tracker.finish());
  }

  npmUpdateAsLatest() {
    const distTag = this.getDistTag() || "latest";
    const tracker = this.logger.newItem("npmUpdateAsLatest");

    tracker.addWork(this.packagesToPublish.length);

    let chain = Promise.resolve();

    const actions = [
      pkg =>
        Promise.resolve()
          .then(() => npmDistTag.check(pkg, "lerna-temp", this.npmConfig))
          .then(exists => {
            if (exists) {
              return npmDistTag.remove(pkg, "lerna-temp", this.npmConfig);
            }
          })
          .then(() => npmDistTag.add(pkg, distTag, this.npmConfig))
          .then(() => pkg),
      pkg => {
        tracker.info("dist-tag", "%s@%s => %j", pkg.name, pkg.version, distTag);
        tracker.completeWork(1);

        return pkg;
      },
    ];

    const mapper = pPipe(actions);

    chain = chain.then(() => runParallelBatches(this.batchedPackages, this.concurrency, mapper));

    return pFinally(chain, () => tracker.finish());
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
