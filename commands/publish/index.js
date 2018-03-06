"use strict";

const os = require("os");
const chalk = require("chalk");
const dedent = require("dedent");
const minimatch = require("minimatch");
const npmConf = require("npm-conf");
const path = require("path");
const pFinally = require("p-finally");
const pMap = require("p-map");
const pReduce = require("p-reduce");
const pWaterfall = require("p-waterfall");
const semver = require("semver");
const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");

const Command = require("@lerna/command");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");
const GitUtilities = require("@lerna/git-utils");
const PromptUtilities = require("@lerna/prompt");
const output = require("@lerna/output");
const collectUpdates = require("@lerna/collect-updates");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const runLifecycle = require("@lerna/run-lifecycle");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const ValidationError = require("@lerna/validation-error");

class PublishCommand extends Command {
  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      conventionalCommits: false,
      exact: false,
      ignoreChanges: [],
      skipGit: false,
      skipNpm: false,
      tempTag: false,
      yes: false,
      allowBranch: false,
    });
  }

  initialize() {
    this.gitRemote = this.options.gitRemote || "origin";
    this.gitEnabled = !(this.options.canary || this.options.skipGit);

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    this.npmConfig = {
      npmClient: this.options.npmClient || "npm",
      registry: this.options.registry,
    };

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
      this.shortHash = GitUtilities.getShortSHA(this.execOpts);
    }

    if (!this.repository.isIndependent()) {
      this.logger.info("current version", this.repository.version);
    }

    // git validation, if enabled, should happen before updates are calculated and versions picked
    if (this.gitEnabled) {
      if (GitUtilities.isDetachedHead(this.execOpts)) {
        throw new ValidationError(
          "ENOGIT",
          "Detached git HEAD, please checkout a branch to publish changes."
        );
      }

      const currentBranch = GitUtilities.getCurrentBranch(this.execOpts);
      if (
        this.options.allowBranch &&
        ![].concat(this.options.allowBranch).some(x => minimatch(currentBranch, x))
      ) {
        throw new ValidationError(
          "ENOTALLOWED",
          dedent`
            Branch '${currentBranch}' is restricted from publishing due to allowBranch config.
            Please consider the reasons for this restriction before overriding the option.
          `
        );
      }
    }

    this.conf = npmConf(this.options);
    this.updates = collectUpdates(this);

    if (!this.updates.length) {
      this.logger.success("No updated packages to publish");

      // still exits zero, aka "ok"
      return false;
    }

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

    const tasks = [
      () => this.getVersionsForUpdates(),
      versions => {
        this.updatesVersions = versions;
      },
      () => this.confirmVersions(),
    ];

    return pWaterfall(tasks);
  }

  execute() {
    const tasks = [];

    if (!this.repository.isIndependent() && !this.options.canary) {
      tasks.push(() => this.updateVersionInLernaJson());
    }

    tasks.push(() => this.updateUpdatedPackages());

    if (this.gitEnabled) {
      tasks.push(() => this.commitAndTagUpdates());
    }

    tasks.push(() => this.resolveLocalDependencyLinks());

    if (!this.options.skipNpm) {
      tasks.push(() => this.publishPackagesToNpm());
    }

    return pWaterfall(tasks);
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

      return writePkg(pkg.manifestLocation, pkg.toJSON()).then(() => pkg);
    }).then(modifiedPkgs => {
      // a Set of modified Package instances is stored for resetting later
      this.locallyResolved = new Set(modifiedPkgs);
    });
  }

  publishPackagesToNpm() {
    this.logger.info("publish", "Publishing packages to npm...");

    let chain = Promise.resolve().then(() => this.npmPublish());

    if (this.options.canary) {
      chain = chain.then(() => this.resetCanaryState());
    }

    if (this.options.tempTag) {
      chain = chain.then(() => this.npmUpdateAsLatest());
    }

    if (this.gitEnabled) {
      chain = chain.then(() => {
        this.logger.info("git", "Pushing tags...");
        return GitUtilities.pushWithTags(this.gitRemote, this.tags, this.execOpts);
      });
    }

    return chain.then(() => {
      const message = this.packagesToPublish.map(pkg => ` - ${pkg.name}@${pkg.version}`);

      output("Successfully published:");
      output(message.join(os.EOL));

      this.logger.success("publish", "finished");
    });
  }

  getVersionsForUpdates() {
    const { canary, cdVersion, conventionalCommits, preid, repoVersion } = this.options;

    const makeGlobalVersionPredicate = nextVersion => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(repoVersion);
    } else if (canary) {
      const release = cdVersion || "minor";
      // FIXME: this complicated defaulting should be done in yargs option.coerce()
      const keyword = typeof canary !== "string" ? preid || "alpha" : canary;

      predicate = ({ version }) => `${semver.inc(version, release)}-${keyword}.${this.shortHash}`;
    } else if (cdVersion) {
      predicate = ({ version }) => semver.inc(version, cdVersion, preid);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions();
    } else {
      predicate = this.promptVersion;
    }

    if (!this.repository.isIndependent()) {
      predicate = Promise.resolve(predicate({ version: this.repository.version })).then(
        makeGlobalVersionPredicate
      );
    }

    return Promise.resolve(predicate).then(getVersion => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion) {
    const iterator = (versionMap, { pkg }) =>
      Promise.resolve(getVersion(pkg)).then(version => versionMap.set(pkg.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  recommendVersions() {
    const independentVersions = this.repository.isIndependent();
    const { changelogPreset } = this.options;
    const opts = { changelogPreset };
    const type = independentVersions ? "independent" : "fixed";

    let chain = Promise.resolve();

    if (type === "fixed") {
      chain = chain.then(() => {
        const globalVersion = this.repository.version;

        for (const { pkg } of this.updates) {
          if (semver.lt(pkg.version, globalVersion)) {
            this.logger.verbose(
              "publish",
              `Overriding version of ${pkg.name} from ${pkg.version} to ${globalVersion}`
            );

            pkg.version = globalVersion;
          }
        }
      });
    }

    chain = chain.then(() =>
      this.reduceVersions(pkg => ConventionalCommitUtilities.recommendVersion(pkg, type, opts))
    );

    if (type === "fixed") {
      chain = chain.then(versions => {
        let highestVersion = this.repository.version;

        versions.forEach(bump => {
          if (semver.gt(bump, highestVersion)) {
            highestVersion = bump;
          }
        });

        this.globalVersion = highestVersion;

        versions.forEach((_, name) => versions.set(name, highestVersion));

        return versions;
      });
    }

    return chain;
  }

  promptVersion({ version: currentVersion, name: pkgName }) {
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");
    const prepatch = semver.inc(currentVersion, "prepatch");
    const preminor = semver.inc(currentVersion, "preminor");
    const premajor = semver.inc(currentVersion, "premajor");

    const message = `Select a new version ${pkgName ? `for ${pkgName} ` : ""}(currently ${currentVersion})`;

    return PromptUtilities.select(message, {
      choices: [
        { value: patch, name: `Patch (${patch})` },
        { value: minor, name: `Minor (${minor})` },
        { value: major, name: `Major (${major})` },
        { value: prepatch, name: `Prepatch (${prepatch})` },
        { value: preminor, name: `Preminor (${preminor})` },
        { value: premajor, name: `Premajor (${premajor})` },
        { value: "PRERELEASE", name: "Prerelease" },
        { value: "CUSTOM", name: "Custom" },
      ],
    }).then(choice => {
      if (choice === "CUSTOM") {
        return PromptUtilities.input("Enter a custom version", {
          filter: semver.valid,
          validate: v => v !== null || "Must be a valid semver version",
        });
      }

      if (choice === "PRERELEASE") {
        const [existingId] = semver.prerelease(currentVersion) || [];
        const defaultVersion = semver.inc(currentVersion, "prerelease", existingId);
        const prompt = `(default: ${existingId ? `"${existingId}"` : "none"}, yielding ${defaultVersion})`;

        // TODO: allow specifying prerelease identifier as CLI option to skip the prompt
        return PromptUtilities.input(`Enter a prerelease identifier ${prompt}`, {
          filter: v => {
            const preid = v || existingId;
            return semver.inc(currentVersion, "prerelease", preid);
          },
        });
      }

      return choice;
    });
  }

  confirmVersions() {
    const changes = this.updates.map(({ pkg }) => {
      let line = ` - ${pkg.name}: ${pkg.version} => ${this.updatesVersions.get(pkg.name)}`;
      if (pkg.private) {
        line += ` (${chalk.red("private")})`;
      }
      return line;
    });

    output("");
    output("Changes:");
    output(changes.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }

    return PromptUtilities.confirm("Are you sure you want to publish the above changes?");
  }

  updateVersionInLernaJson() {
    this.repository.lernaJson.version = this.globalVersion;

    return writeJsonFile(this.repository.lernaJsonLocation, this.repository.lernaJson, { indent: 2 }).then(
      () => {
        if (!this.options.skipGit) {
          return GitUtilities.addFiles([this.repository.lernaJsonLocation], this.execOpts);
        }
      }
    );
  }

  runPackageLifecycle(pkg, stage) {
    if (pkg.scripts[stage]) {
      return runLifecycle(pkg, stage, this.conf).catch(err => {
        this.logger.error("lifecycle", `error running ${stage} in ${pkg.name}\n`, err.stack || err);
      });
    }
  }

  updateUpdatedPackages() {
    const { conventionalCommits, changelogPreset } = this.options;
    const independentVersions = this.repository.isIndependent();
    const rootPkg = this.repository.package;
    const changedFiles = new Set();

    // my kingdom for async await :(
    let chain = Promise.resolve();

    // exec preversion lifecycle in root (before all updates)
    chain = chain.then(() => this.runPackageLifecycle(rootPkg, "preversion"));

    chain = chain.then(() =>
      pMap(
        this.updates,
        ({ pkg, localDependencies }) =>
          // start the chain
          Promise.resolve()

            // exec preversion script
            .then(() => this.runPackageLifecycle(pkg, "preversion"))

            // write new package
            .then(() => {
              // set new version
              pkg.version = this.updatesVersions.get(pkg.name);

              // update pkg dependencies
              for (const [depName, resolved] of localDependencies) {
                const depVersion = this.updatesVersions.get(depName);

                if (depVersion && resolved.type !== "directory") {
                  // don't overwrite local file: specifiers (yet)
                  pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
                }
              }

              // NOTE: Object.prototype.toJSON() is normally called when passed to
              // JSON.stringify(), but write-pkg iterates Object.keys() before serializing
              // so it has to be explicit here (otherwise it mangles the instance properties)
              return writePkg(pkg.manifestLocation, pkg.toJSON()).then(() => {
                // commit the updated manifest
                changedFiles.add(pkg.manifestLocation);
              });
            })

            // exec version script
            .then(() => this.runPackageLifecycle(pkg, "version"))

            .then(() => {
              if (conventionalCommits) {
                // we can now generate the Changelog, based on the
                // the updated version that we're about to release.
                const type = independentVersions ? "independent" : "fixed";

                return ConventionalCommitUtilities.updateChangelog(pkg, type, { changelogPreset }).then(
                  changelogLocation => {
                    // commit the updated changelog
                    changedFiles.add(changelogLocation);
                  }
                );
              }
            }),
        // TODO: tune the concurrency
        { concurrency: 100 }
      )
    );

    if (conventionalCommits && !independentVersions) {
      chain = chain.then(() =>
        ConventionalCommitUtilities.updateChangelog(rootPkg, "root", {
          changelogPreset,
          version: this.globalVersion,
        }).then(changelogLocation => {
          // commit the updated changelog
          changedFiles.add(changelogLocation);
        })
      );
    }

    // exec version lifecycle in root (after all updates)
    chain = chain.then(() => this.runPackageLifecycle(rootPkg, "version"));

    if (this.gitEnabled) {
      // chain = chain.then(() => GitUtilities.addFiles(changedFiles, this.execOpts));
      chain = chain.then(() => GitUtilities.addFiles(Array.from(changedFiles), this.execOpts));
    }

    return chain;
  }

  commitAndTagUpdates() {
    let chain = Promise.resolve();

    if (this.repository.isIndependent()) {
      chain = chain.then(() => this.gitCommitAndTagVersionForUpdates());
    } else {
      chain = chain.then(() => this.gitCommitAndTagVersion());
    }

    chain = chain.then(tags => {
      this.tags = tags;
    });

    // run the postversion script for each update
    chain = chain.then(() => pMap(this.updates, ({ pkg }) => this.runPackageLifecycle(pkg, "postversion")));

    // run postversion, if set, in the root directory
    chain = chain.then(() => this.runPackageLifecycle(this.repository.package, "postversion"));

    return chain;
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map(({ pkg }) => `${pkg.name}@${this.updatesVersions.get(pkg.name)}`);
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    return Promise.resolve()
      .then(() => GitUtilities.commit(message, this.execOpts))
      .then(() => Promise.all(tags.map(tag => GitUtilities.addTag(tag, this.execOpts))))
      .then(() => tags);
  }

  gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `v${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    return Promise.resolve()
      .then(() => GitUtilities.commit(message, this.execOpts))
      .then(() => GitUtilities.addTag(tag, this.execOpts))
      .then(() => [tag]);
  }

  resetCanaryState() {
    this.logger.info("canary", "Resetting git state");

    // reset since the package.json files are changed
    return pMap(this.repository.packageConfigs, pkgGlob =>
      GitUtilities.checkoutChanges(`${pkgGlob}/package.json`, this.execOpts)
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

  npmPublish() {
    const tracker = this.logger.newItem("npmPublish");
    // if we skip temp tags we should tag with the proper value immediately
    const distTag = this.options.tempTag ? "lerna-temp" : this.getDistTag();

    this.updates.forEach(({ pkg }) => this.execScript(pkg, "prepublish"));

    tracker.addWork(this.packagesToPublish.length);

    const mapPackage = pkg => {
      tracker.verbose("publishing", pkg.name);

      return npmPublish(distTag, pkg, this.npmConfig).then(() => {
        tracker.info("published", pkg.name);
        tracker.completeWork(1);

        this.execScript(pkg, "postpublish");

        // reset any local relative links (git commit has already happened)
        if (this.locallyResolved.has(pkg)) {
          // done one-by-one to leave publishable state in working directory on error
          return GitUtilities.checkoutChanges(pkg.manifestLocation, this.execOpts);
        }
      });
    };

    return pFinally(runParallelBatches(this.batchedPackages, this.concurrency, mapPackage), () =>
      tracker.finish()
    );
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
    const distTag = this.getDistTag();
    const version = this.options.canary ? pkg.version : this.updatesVersions.get(pkg.name);

    return this.removeTempTag(pkg).then(() => npmDistTag.add(pkg, version, distTag, this.npmConfig.registry));
  }

  getDistTag() {
    return this.options.npmTag || (this.options.canary && "canary") || "latest";
  }
}

module.exports = PublishCommand;
