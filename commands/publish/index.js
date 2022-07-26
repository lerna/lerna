"use strict";

const os = require("os");
const path = require("path");
const crypto = require("crypto");
const pMap = require("p-map");
const pPipe = require("p-pipe");
const semver = require("semver");

const { Command } = require("@lerna/command");
const { ValidationError } = require("@lerna/validation-error");
const { describeRef } = require("@lerna/describe-ref");
const { throwIfUncommitted } = require("@lerna/check-working-tree");
const { promptConfirmation } = require("@lerna/prompt");
const { output } = require("@lerna/output");
const { collectUpdates } = require("@lerna/collect-updates");
const npmConf = require("@lerna/npm-conf");
const npmDistTag = require("@lerna/npm-dist-tag");
const { npmPublish } = require("@lerna/npm-publish");
const { packDirectory } = require("@lerna/pack-directory");
const { logPacked } = require("@lerna/log-packed");
const { createRunner } = require("@lerna/run-lifecycle");
const { runTopologically } = require("@lerna/run-topologically");
const { pulseTillDone } = require("@lerna/pulse-till-done");
const versionCommand = require("@lerna/version");
const { prereleaseIdFromVersion } = require("@lerna/prerelease-id-from-version");
const { getOneTimePassword } = require("@lerna/otplease");

const { createTempLicenses } = require("./lib/create-temp-licenses");
const { getCurrentSHA } = require("./lib/get-current-sha");
const { getCurrentTags } = require("./lib/get-current-tags");
const { getUnpublishedPackages } = require("./lib/get-unpublished-packages");
const { getNpmUsername } = require("./lib/get-npm-username");
const { getTaggedPackages } = require("./lib/get-tagged-packages");
const { getPackagesWithoutLicense } = require("./lib/get-packages-without-license");
const { gitCheckout } = require("./lib/git-checkout");
const { removeTempLicenses } = require("./lib/remove-temp-licenses");
const { verifyNpmPackageAccess } = require("./lib/verify-npm-package-access");
const { getTwoFactorAuthRequired } = require("./lib/get-two-factor-auth-required");

module.exports = factory;

function factory(argv) {
  return new PublishCommand(argv);
}

class PublishCommand extends Command {
  get otherCommandConfigs() {
    // back-compat
    return ["version"];
  }

  get requiresGit() {
    // `lerna publish from-package` doesn't _need_ git, per se
    return this.options.bump !== "from-package";
  }

  configureProperties() {
    super.configureProperties();

    // For publish we want to enable topological sorting by default, but allow users to override with --no-sort
    this.toposort = this.options.sort !== false;

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      // prettier-ignore
      exact,
      gitHead,
      gitReset,
      tagVersionPrefix = "v",
      verifyAccess,
    } = this.options;

    if (this.requiresGit && gitHead) {
      throw new ValidationError("EGITHEAD", "--git-head is only allowed with 'from-package' positional");
    }

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = exact ? "" : "^";

    // https://docs.npmjs.com/misc/config#tag-version-prefix
    this.tagPrefix = tagVersionPrefix;
    // TODO: properly inherit from npm-conf

    // inverted boolean options are only respected if prefixed with `--no-`, e.g. `--no-verify-access`
    this.gitReset = gitReset !== false;

    // consumed by npm-registry-fetch (via libnpmpublish)
    this.npmSession = crypto.randomBytes(8).toString("hex");

    this.verifyAccess = verifyAccess;
  }

  get userAgent() {
    // consumed by npm-registry-fetch (via libnpmpublish)
    return `lerna/${this.options.lernaVersion}/node@${process.version}+${process.arch} (${process.platform})`;
  }

  initialize() {
    if (this.options.verifyAccess === false) {
      this.logger.warn(
        "verify-access",
        "--verify-access=false and --no-verify-access are no longer needed, because the legacy preemptive access verification is now disabled by default. Requests will fail with appropriate errors when not authorized correctly."
      );
    }

    if (this.options.graphType === "dependencies") {
      this.logger.warn(
        "graph-type",
        "--graph-type=dependencies is deprecated and will be removed in lerna v6. If you have a use-case you feel requires it please open an issue to discuss: https://github.com/lerna/lerna/issues/new/choose"
      );
    }

    if (this.options.skipNpm) {
      // TODO: remove in next major release
      this.logger.warn("deprecated", "Instead of --skip-npm, call `lerna version` directly");

      return versionCommand(this.argv).then(() => false);
    }

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (this.options.requireScripts) {
      this.logger.info("require-scripts", "enabled");
    }

    // npmSession and user-agent are consumed by npm-registry-fetch (via libnpmpublish)
    this.logger.verbose("session", this.npmSession);
    this.logger.verbose("user-agent", this.userAgent);

    this.conf = npmConf({
      lernaCommand: "publish",
      _auth: this.options.legacyAuth,
      npmSession: this.npmSession,
      npmVersion: this.userAgent,
      otp: this.options.otp,
      registry: this.options.registry,
      "ignore-prepublish": this.options.ignorePrepublish,
      "ignore-scripts": this.options.ignoreScripts,
    });

    // cache to hold a one-time-password across publishes
    this.otpCache = { otp: this.conf.get("otp") };

    this.conf.set("user-agent", this.userAgent, "cli");

    if (this.conf.get("registry") === "https://registry.yarnpkg.com") {
      this.logger.warn("", "Yarn's registry proxy is broken, replacing with public npm registry");
      this.logger.warn("", "If you don't have an npm token, you should exit and run `npm login`");

      this.conf.set("registry", "https://registry.npmjs.org/", "cli");
    }

    // inject --dist-tag into opts, if present
    const distTag = this.getDistTag();

    if (distTag) {
      this.conf.set("tag", distTag.trim(), "cli");
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf) {
      this.logger.info("publish", "rooted leaf detected, skipping synthetic root lifecycles");
    }

    this.runPackageLifecycle = createRunner(this.options);

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?publish$/.test(process.env.npm_lifecycle_event)
      ? (stage) => {
          this.logger.warn("lifecycle", "Skipping root %j because it has already been called", stage);
        }
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    let chain = Promise.resolve();

    if (this.options.bump === "from-git") {
      chain = chain.then(() => this.detectFromGit());
    } else if (this.options.bump === "from-package") {
      chain = chain.then(() => this.detectFromPackage());
    } else if (this.options.canary) {
      chain = chain.then(() => this.detectCanaryVersions());
    } else {
      chain = chain.then(() => versionCommand(this.argv));
    }

    return chain.then((result) => {
      if (!result) {
        // early return from nested VersionCommand
        return false;
      }

      if (!result.updates.length) {
        this.logger.success("No changed packages to publish");

        // still exits zero, aka "ok"
        return false;
      }

      // (occasionally) redundant private filtering necessary to handle nested VersionCommand
      this.updates = result.updates.filter((node) => !node.pkg.private);
      this.updatesVersions = new Map(result.updatesVersions);

      this.packagesToPublish = this.updates.map((node) => node.pkg);

      if (this.options.contents) {
        // globally override directory to publish
        for (const pkg of this.packagesToPublish) {
          pkg.contents = this.options.contents;
        }
      }

      if (result.needsConfirmation) {
        // only confirm for --canary, bump === "from-git",
        // or bump === "from-package", as VersionCommand
        // has its own confirmation prompt
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
    chain = chain.then(() => this.serializeChanges());
    chain = chain.then(() => this.packUpdated());
    chain = chain.then(() => this.publishPacked());

    if (this.gitReset) {
      chain = chain.then(() => this.resetChanges());
    }

    if (this.options.tempTag) {
      chain = chain.then(() => this.npmUpdateAsLatest());
    }

    return chain.then(() => {
      const count = this.packagesToPublish.length;
      const message = this.packagesToPublish.map((pkg) => ` - ${pkg.name}@${pkg.version}`);

      output("Successfully published:");
      output(message.join(os.EOL));

      this.logger.success("published", "%d %s", count, count === 1 ? "package" : "packages");
    });
  }

  verifyWorkingTreeClean() {
    return describeRef(this.execOpts).then(throwIfUncommitted);
  }

  detectFromGit() {
    const matchingPattern = this.project.isIndependent() ? "*@*" : `${this.tagPrefix}*.*.*`;

    let chain = Promise.resolve();

    // attempting to publish a tagged release with local changes is not allowed
    chain = chain.then(() => this.verifyWorkingTreeClean());

    chain = chain.then(() => getCurrentTags(this.execOpts, matchingPattern));
    chain = chain.then((taggedPackageNames) => {
      if (!taggedPackageNames.length) {
        this.logger.notice("from-git", "No tagged release found");

        return [];
      }

      if (this.project.isIndependent()) {
        return taggedPackageNames.map((name) => this.packageGraph.get(name));
      }

      return getTaggedPackages(this.packageGraph, this.project.rootPath, this.execOpts);
    });

    // private packages are never published, full stop.
    chain = chain.then((updates) => updates.filter((node) => !node.pkg.private));

    return chain.then((updates) => {
      const updatesVersions = updates.map((node) => [node.name, node.version]);

      return {
        updates,
        updatesVersions,
        needsConfirmation: true,
      };
    });
  }

  detectFromPackage() {
    let chain = Promise.resolve();

    // attempting to publish a release with local changes is not allowed
    chain = chain
      .then(() => this.verifyWorkingTreeClean())
      .catch((err) => {
        // an execa error is thrown when git suffers a fatal error (such as no git repository present)
        if (err.failed && /git describe/.test(err.command)) {
          // (we tried)
          this.logger.silly("EWORKINGTREE", err.message);
          this.logger.notice("FYI", "Unable to verify working tree, proceed at your own risk");
        } else {
          // validation errors should be preserved
          throw err;
        }
      });

    // private packages are already omitted by getUnpublishedPackages()
    chain = chain.then(() => getUnpublishedPackages(this.packageGraph, this.conf.snapshot));
    chain = chain.then((unpublished) => {
      if (!unpublished.length) {
        this.logger.notice("from-package", "No unpublished release found");
      }

      return unpublished;
    });

    return chain.then((updates) => {
      const updatesVersions = updates.map((node) => [node.name, node.version]);

      return {
        updates,
        updatesVersions,
        needsConfirmation: true,
      };
    });
  }

  detectCanaryVersions() {
    const { cwd } = this.execOpts;
    const {
      bump = "prepatch",
      preid = "alpha",
      ignoreChanges,
      forcePublish,
      includeMergedTags,
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
        includeMergedTags,
        // private packages are never published, don't bother describing their refs.
      }).filter((node) => !node.pkg.private)
    );

    const makeVersion = (fallback) => ({ lastVersion = fallback, refCount, sha }) => {
      // the next version is bumped without concern for preid or current index
      const nextVersion = semver.inc(lastVersion.replace(this.tagPrefix, ""), release.replace("pre", ""));

      // semver.inc() starts a new prerelease at .0, git describe starts at .1
      // and build metadata is always ignored when comparing dependency ranges
      return `${nextVersion}-${preid}.${Math.max(0, refCount - 1)}+${sha}`;
    };

    if (this.project.isIndependent()) {
      // each package is described against its tags only
      chain = chain.then((updates) =>
        pMap(updates, (node) =>
          describeRef(
            {
              match: `${node.name}@*`,
              cwd,
            },
            includeMergedTags
          )
            // an unpublished package will have no reachable git tag
            .then(makeVersion(node.version))
            .then((version) => [node.name, version])
        ).then((updatesVersions) => ({
          updates,
          updatesVersions,
        }))
      );
    } else {
      // all packages are described against the last tag
      chain = chain.then((updates) =>
        describeRef(
          {
            match: `${this.tagPrefix}*.*.*`,
            cwd,
          },
          includeMergedTags
        )
          // a repo with no tags should default to whatever lerna.json claims
          .then(makeVersion(this.project.version))
          .then((version) => updates.map((node) => [node.name, version]))
          .then((updatesVersions) => ({
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
      (pkg) => ` - ${pkg.name} => ${this.updatesVersions.get(pkg.name)}`
    );

    output("");
    output(`Found ${count} ${count === 1 ? "package" : "packages"} to publish:`);
    output(message.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }

    return promptConfirmation("Are you sure you want to publish these packages?");
  }

  prepareLicenseActions() {
    return Promise.resolve()
      .then(() => getPackagesWithoutLicense(this.project, this.packagesToPublish))
      .then((packagesWithoutLicense) => {
        if (packagesWithoutLicense.length && !this.project.licensePath) {
          this.packagesToBeLicensed = [];

          const names = packagesWithoutLicense.map((pkg) => pkg.name);
          const noun = names.length > 1 ? "Packages" : "Package";
          const verb = names.length > 1 ? "are" : "is";
          const list =
            names.length > 1
              ? `${names.slice(0, -1).join(", ")}${names.length > 2 ? "," : ""} and ${
                  names[names.length - 1] /* oxford commas _are_ that important */
                }`
              : names[0];

          this.logger.warn(
            "ENOLICENSE",
            "%s %s %s missing a license.\n%s\n%s",
            noun,
            list,
            verb,
            "One way to fix this is to add a LICENSE.md file to the root of this repository.",
            "See https://choosealicense.com for additional guidance."
          );
        } else {
          this.packagesToBeLicensed = packagesWithoutLicense;
        }
      });
  }

  prepareRegistryActions() {
    let chain = Promise.resolve();

    if (this.conf.get("registry") !== "https://registry.npmjs.org/") {
      this.logger.notice("", "Skipping all user and access validation due to third-party registry");
      this.logger.notice("", "Make sure you're authenticated properly ¯\\_(ツ)_/¯");

      return chain;
    }

    /* istanbul ignore if */
    if (process.env.LERNA_INTEGRATION) {
      return chain;
    }

    if (this.verifyAccess) {
      // validate user has valid npm credentials first,
      // by far the most common form of failed execution
      chain = chain.then(() => getNpmUsername(this.conf.snapshot));
      chain = chain.then((username) => {
        // if no username was retrieved, don't bother validating
        if (username) {
          return verifyNpmPackageAccess(this.packagesToPublish, username, this.conf.snapshot);
        }
      });

      // read profile metadata to determine if account-level 2FA is enabled
      chain = chain.then(() => getTwoFactorAuthRequired(this.conf.snapshot));
      chain = chain.then((isRequired) => {
        // notably, this still doesn't handle package-level 2FA requirements
        this.twoFactorAuthRequired = isRequired;
      });
    }

    return chain;
  }

  updateCanaryVersions() {
    return pMap(this.updates, (node) => {
      node.pkg.set("version", this.updatesVersions.get(node.name));

      for (const [depName, resolved] of node.localDependencies) {
        // other canary versions need to be updated, non-canary is a no-op
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  resolveLocalDependencyLinks() {
    // resolve relative file: links to their actual version range
    const updatesWithLocalLinks = this.updates.filter((node) =>
      Array.from(node.localDependencies.values()).some((resolved) => resolved.type === "directory")
    );

    return pMap(updatesWithLocalLinks, (node) => {
      for (const [depName, resolved] of node.localDependencies) {
        // regardless of where the version comes from, we can't publish "file:../sibling-pkg" specs
        const depVersion = this.updatesVersions.get(depName) || this.packageGraph.get(depName).pkg.version;

        // it no longer matters if we mutate the shared Package instance
        node.pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
      }

      // writing changes to disk handled in serializeChanges()
    });
  }

  annotateGitHead() {
    try {
      const gitHead = this.options.gitHead || getCurrentSHA(this.execOpts);

      for (const pkg of this.packagesToPublish) {
        // provide gitHead property that is normally added during npm publish
        pkg.set("gitHead", gitHead);
      }
    } catch (err) {
      // from-package should be _able_ to run without git, but at least we tried
      this.logger.silly("EGITHEAD", err.message);
      this.logger.notice(
        "FYI",
        "Unable to set temporary gitHead property, it will be missing from registry metadata"
      );
    }

    // writing changes to disk handled in serializeChanges()
  }

  serializeChanges() {
    return pMap(this.packagesToPublish, (pkg) => pkg.serialize());
  }

  resetChanges() {
    // the package.json files are changed (by gitHead if not --canary)
    // and we should always __attempt_ to leave the working tree clean
    const { cwd } = this.execOpts;
    const gitOpts = {
      granularPathspec: this.options.granularPathspec !== false,
    };
    const dirtyManifests = [this.project.manifest]
      .concat(this.packagesToPublish)
      .map((pkg) => path.relative(cwd, pkg.manifestLocation));

    return gitCheckout(dirtyManifests, gitOpts, this.execOpts).catch((err) => {
      this.logger.silly("EGITCHECKOUT", err.message);
      this.logger.notice("FYI", "Unable to reset working tree changes, this probably isn't a git repo.");
    });
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
        removeTempLicenses(this.packagesToBeLicensed).catch((removeError) => {
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

  requestOneTimePassword() {
    // if OTP has already been provided, skip prompt
    if (this.otpCache.otp) {
      return;
    }

    return Promise.resolve()
      .then(() => getOneTimePassword("Enter OTP:"))
      .then((otp) => {
        this.otpCache.otp = otp;
      });
  }

  topoMapPackages(mapper) {
    return runTopologically(this.packagesToPublish, mapper, {
      concurrency: this.concurrency,
      rejectCycles: this.options.rejectCycles,
      /**
       * Previously `publish` had unique default behavior for graph creation vs other commands: it would only consider dependencies when finding
       * edges by default (i.e. relationships between packages specified via devDependencies would be ignored). It was documented to be the case
       * in order to try and reduce the chance of dependency cycles.
       *
       * We are removing this behavior altogether in v6 because we do not want to have different ways of constructing the graph,
       * only different ways of utilizing it (e.g. --no-sort vs topological sort).
       *
       * Therefore until we remove graphType altogether in v6, we provide a way for users to opt into the old default behavior
       * by setting the `graphType` option to `dependencies`.
       */
      graphType: this.options.graphType === "dependencies" ? "dependencies" : "allDependencies",
    });
  }

  packUpdated() {
    const tracker = this.logger.newItem("npm pack");

    tracker.addWork(this.packagesToPublish.length);

    let chain = Promise.resolve();

    chain = chain.then(() => createTempLicenses(this.project.licensePath, this.packagesToBeLicensed));

    if (!this.hasRootedLeaf) {
      // despite being deprecated for years...
      chain = chain.then(() => this.runRootLifecycle("prepublish"));

      // these lifecycles _should_ never be employed to run `lerna publish`...
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepare"));
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepublishOnly"));
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "prepack"));
    }

    const opts = this.conf.snapshot;
    const mapper = pPipe(
      ...[
        this.options.requireScripts && ((pkg) => this.execScript(pkg, "prepublish")),

        (pkg) =>
          pulseTillDone(packDirectory(pkg, pkg.location, opts)).then((packed) => {
            tracker.verbose("packed", path.relative(this.project.rootPath, pkg.contents));
            tracker.completeWork(1);

            // store metadata for use in this.publishPacked()
            pkg.packed = packed;

            // manifest may be mutated by any previous lifecycle
            return pkg.refresh();
          }),
      ].filter(Boolean)
    );

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages(mapper);
      }
      return pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });
    });

    chain = chain.then(() => removeTempLicenses(this.packagesToBeLicensed));

    // remove temporary license files if _any_ error occurs _anywhere_ in the promise chain
    chain = chain.catch((error) => this.removeTempLicensesOnError(error));

    if (!this.hasRootedLeaf) {
      chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "postpack"));
    }

    return chain.finally(() => tracker.finish());
  }

  publishPacked() {
    const tracker = this.logger.newItem("publish");

    tracker.addWork(this.packagesToPublish.length);

    let chain = Promise.resolve();

    // if account-level 2FA is enabled, prime the OTP cache
    if (this.twoFactorAuthRequired) {
      chain = chain.then(() => this.requestOneTimePassword());
    }

    const opts = Object.assign(this.conf.snapshot, {
      // distTag defaults to "latest" OR whatever is in pkg.publishConfig.tag
      // if we skip temp tags we should tag with the proper value immediately
      tag: this.options.tempTag ? "lerna-temp" : this.conf.get("tag"),
    });

    const mapper = pPipe(
      ...[
        (pkg) => {
          const preDistTag = this.getPreDistTag(pkg);
          const tag = !this.options.tempTag && preDistTag ? preDistTag : opts.tag;
          const pkgOpts = Object.assign({}, opts, { tag });

          return pulseTillDone(npmPublish(pkg, pkg.packed.tarFilePath, pkgOpts, this.otpCache)).then(() => {
            tracker.success("published", pkg.name, pkg.version);
            tracker.completeWork(1);

            logPacked(pkg.packed);

            return pkg;
          });
        },

        this.options.requireScripts && ((pkg) => this.execScript(pkg, "postpublish")),
      ].filter(Boolean)
    );

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages(mapper);
      }
      return pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });
    });

    if (!this.hasRootedLeaf) {
      // cyclical "publish" lifecycles are automatically skipped
      chain = chain.then(() => this.runRootLifecycle("publish"));
      chain = chain.then(() => this.runRootLifecycle("postpublish"));
    }

    return chain.finally(() => tracker.finish());
  }

  npmUpdateAsLatest() {
    const tracker = this.logger.newItem("npmUpdateAsLatest");

    tracker.addWork(this.packagesToPublish.length);
    tracker.showProgress();

    let chain = Promise.resolve();

    const opts = this.conf.snapshot;
    const getDistTag = (publishConfig) => {
      if (opts.tag === "latest" && publishConfig && publishConfig.tag) {
        return publishConfig.tag;
      }

      return opts.tag;
    };
    const mapper = (pkg) => {
      const spec = `${pkg.name}@${pkg.version}`;
      const preDistTag = this.getPreDistTag(pkg);
      const distTag = preDistTag || getDistTag(pkg.get("publishConfig"));

      return Promise.resolve()
        .then(() => pulseTillDone(npmDistTag.remove(spec, "lerna-temp", opts, this.otpCache)))
        .then(() => pulseTillDone(npmDistTag.add(spec, distTag, opts, this.otpCache)))
        .then(() => {
          tracker.success("dist-tag", "%s@%s => %j", pkg.name, pkg.version, distTag);
          tracker.completeWork(1);

          return pkg;
        });
    };

    chain = chain.then(() => {
      if (this.toposort) {
        return this.topoMapPackages(mapper);
      }
      return pMap(this.packagesToPublish, mapper, { concurrency: this.concurrency });
    });

    return chain.finally(() => tracker.finish());
  }

  getDistTag() {
    if (this.options.distTag) {
      return this.options.distTag;
    }

    if (this.options.canary) {
      return "canary";
    }

    // undefined defaults to "latest" OR whatever is in pkg.publishConfig.tag
  }

  getPreDistTag(pkg) {
    if (!this.options.preDistTag) {
      return;
    }
    const isPrerelease = prereleaseIdFromVersion(pkg.version);
    if (isPrerelease) {
      return this.options.preDistTag;
    }
  }
}

module.exports.PublishCommand = PublishCommand;
