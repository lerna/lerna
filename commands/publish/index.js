"use strict";

const os = require("os");
const chalk = require("chalk");
const dedent = require("dedent");
const minimatch = require("minimatch");
const path = require("path");
const pFinally = require("p-finally");
const pMap = require("p-map");
const pReduce = require("p-reduce");
const pWaterfall = require("p-waterfall");
const semver = require("semver");

const Command = require("@lerna/command");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");
const PromptUtilities = require("@lerna/prompt");
const output = require("@lerna/output");
const collectUpdates = require("@lerna/collect-updates");
const npmConf = require("@lerna/npm-conf");
const npmDistTag = require("@lerna/npm-dist-tag");
const npmPublish = require("@lerna/npm-publish");
const runLifecycle = require("@lerna/run-lifecycle");
const batchPackages = require("@lerna/batch-packages");
const runParallelBatches = require("@lerna/run-parallel-batches");
const ValidationError = require("@lerna/validation-error");

const getCurrentBranch = require("./lib/get-current-branch");
const getCurrentSHA = require("./lib/get-current-sha");
const getShortSHA = require("./lib/get-short-sha");
const gitAdd = require("./lib/git-add");
const gitCheckout = require("./lib/git-checkout");
const gitCommit = require("./lib/git-commit");
const gitPush = require("./lib/git-push");
const gitTag = require("./lib/git-tag");
const isBehindUpstream = require("./lib/is-behind-upstream");

module.exports = factory;

function factory(argv) {
  return new PublishCommand(argv);
}

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
    }

    if (!this.project.isIndependent()) {
      this.logger.info("current version", this.project.version);
    }

    // git validation, if enabled, should happen before updates are calculated and versions picked
    if (this.gitEnabled) {
      this.currentBranch = getCurrentBranch(this.execOpts);

      if (this.currentBranch === "HEAD") {
        throw new ValidationError(
          "ENOGIT",
          "Detached git HEAD, please checkout a branch to publish changes."
        );
      }

      if (
        this.options.allowBranch &&
        ![].concat(this.options.allowBranch).some(x => minimatch(this.currentBranch, x))
      ) {
        throw new ValidationError(
          "ENOTALLOWED",
          dedent`
            Branch '${this.currentBranch}' is restricted from publishing due to allowBranch config.
            Please consider the reasons for this restriction before overriding the option.
          `
        );
      }

      if (isBehindUpstream(this.gitRemote, this.currentBranch, this.execOpts)) {
        const message = `Local branch '${this.currentBranch}' is behind remote upstream ${this.gitRemote}/${
          this.currentBranch
        }`;

        if (!this.options.ci) {
          // interrupt interactive publish
          throw new ValidationError(
            "EBEHIND",
            dedent`
              ${message}
              Please merge remote changes into '${this.currentBranch}' with 'git pull'
            `
          );
        }

        // CI publish should not error, but warn & exit
        this.logger.warn("EBEHIND", `${message}, exiting`);

        // still exits zero, aka "ok"
        return false;
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

    const isBreakingChange = (currentVersion, nextVersion) => {
      const releaseType = semver.diff(currentVersion, nextVersion);
      switch (releaseType) {
        case "major":
          return true;
        case "minor":
          return semver.lt(currentVersion, "1.0.0");
        case "patch":
        case "prepatch":
          return semver.lt(currentVersion, "0.1.0");
        case "preminor":
        case "premajor":
        case "prerelease":
          return false;
        default: {
          const err = { error: "not expected release type" };
          throw err;
        }
      }
    };

    const tasks = [
      () => this.getVersionsForUpdates(),
      versions => {
        const packages =
          this.filteredPackages.length === this.packageGraph.size
            ? this.packageGraph
            : new Map(this.filteredPackages.map(({ name }) => [name, this.packageGraph.get(name)]));
        if (this.project.isIndependent() || versions.size === packages.size) {
          // independent, force-pulibsh=*, or carnary
          this.updatesVersions = versions;
        } else {
          // fixed mode, versions are all highest version;
          let nextVersion;
          let hasBreakingChange = false;
          versions.forEach((version, pkgName) => {
            nextVersion = version;
            const originVer = this.packages.find(p => p.name === pkgName).version;
            if (isBreakingChange(originVer, version)) {
              hasBreakingChange = true;
            }
          });
          if (hasBreakingChange) {
            this.updates = Array.from(packages.values());
            this.updatesVersions = new Map();
            this.updates.forEach(pkg => {
              this.updatesVersions.set(pkg.name, nextVersion);
            });
          } else {
            this.updatesVersions = versions;
          }
        }
      },
      () => this.confirmVersions(),
    ];

    return pWaterfall(tasks);
  }

  execute() {
    this.enableProgressBar();

    const tasks = [];

    if (!this.project.isIndependent() && !this.options.canary) {
      tasks.push(() => this.updateVersionInLernaJson());
    }

    tasks.push(() => this.updateUpdatedPackages());

    if (this.gitEnabled) {
      tasks.push(() => this.commitAndTagUpdates());
    } else {
      this.logger.info("execute", "Skipping git commit/push");
    }

    if (this.options.skipNpm) {
      this.logger.info("execute", "Skipping publish to registry");
    } else {
      tasks.push(() => this.publishPackagesToNpm());
    }

    if (this.gitEnabled) {
      tasks.push(() => this.pushToRemote());
    }

    return pWaterfall(tasks).then(() => {
      this.logger.success("publish", "finished");
    });
  }

  pushToRemote() {
    this.logger.info("git", "Pushing tags...");

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts);
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

    return pMap(this.updates, ({ pkg }) => {
      if (!pkg.private) {
        // provide gitHead property that is normally added during npm publish
        pkg.set("gitHead", gitHead);

        return pkg.serialize();
      }
    });
  }

  resetManifestChanges() {
    // the package.json files are changed (by gitHead if not --canary)
    // and we should always leave the working tree clean
    return pReduce(this.project.packageConfigs, (_, pkgGlob) =>
      gitCheckout(`${pkgGlob}/package.json`, this.execOpts)
    );
  }

  publishPackagesToNpm() {
    this.logger.info("publish", "Publishing packages to npm...");

    let chain = Promise.resolve();

    chain = chain.then(() => this.resolveLocalDependencyLinks());
    chain = chain.then(() => this.annotateGitHead());
    chain = chain.then(() => this.npmPublish());
    chain = chain.then(() => this.resetManifestChanges());

    if (this.options.tempTag) {
      chain = chain.then(() => this.npmUpdateAsLatest());
    }

    return chain.then(() => {
      const message = this.packagesToPublish.map(pkg => ` - ${pkg.name}@${pkg.version}`);

      output("Successfully published:");
      output(message.join(os.EOL));
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
      const shortHash = getShortSHA(this.execOpts);

      predicate = ({ version }) => `${semver.inc(version, release)}-${keyword}.${shortHash}`;
    } else if (cdVersion) {
      predicate = ({ version }) => semver.inc(version, cdVersion, preid);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions();
    } else {
      predicate = this.promptVersion;
    }

    if (!this.project.isIndependent()) {
      predicate = Promise.resolve(predicate({ version: this.project.version })).then(
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
    const independentVersions = this.project.isIndependent();
    const { changelogPreset } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? "independent" : "fixed";

    let chain = Promise.resolve();

    if (type === "fixed") {
      chain = chain.then(() => {
        const globalVersion = this.project.version;

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
      this.reduceVersions(pkg =>
        ConventionalCommitUtilities.recommendVersion(pkg, type, {
          changelogPreset,
          rootPath,
        })
      )
    );

    if (type === "fixed") {
      chain = chain.then(versions => {
        let highestVersion = this.project.version;

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

  // TODO: extract out of class
  // eslint-disable-next-line class-methods-use-this
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
    this.project.version = this.globalVersion;

    return this.project.serializeConfig().then(lernaConfigLocation => {
      if (!this.options.skipGit) {
        return gitAdd([lernaConfigLocation], this.execOpts);
      }
    });
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
    const independentVersions = this.project.isIndependent();
    const rootPkg = this.project.manifest;
    const rootPath = rootPkg.location;
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

              return pkg.serialize().then(() => {
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

                return ConventionalCommitUtilities.updateChangelog(pkg, type, {
                  changelogPreset,
                  rootPath,
                }).then(changelogLocation => {
                  // commit the updated changelog
                  changedFiles.add(changelogLocation);
                });
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
          rootPath,
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
      chain = chain.then(() => gitAdd(Array.from(changedFiles), this.execOpts));
    }

    return chain;
  }

  commitAndTagUpdates() {
    let chain = Promise.resolve();

    if (this.project.isIndependent()) {
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
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "postversion"));

    return chain;
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map(({ pkg }) => `${pkg.name}@${this.updatesVersions.get(pkg.name)}`);
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    return Promise.resolve()
      .then(() => gitCommit(message, this.execOpts))
      .then(() => Promise.all(tags.map(tag => gitTag(tag, this.execOpts))))
      .then(() => tags);
  }

  gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `v${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    return Promise.resolve()
      .then(() => gitCommit(message, this.execOpts))
      .then(() => gitTag(tag, this.execOpts))
      .then(() => [tag]);
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

  npmPublish() {
    const tracker = this.logger.newItem("npmPublish");
    // if we skip temp tags we should tag with the proper value immediately
    const distTag = this.options.tempTag ? "lerna-temp" : this.getDistTag();
    const rootPkg = this.project.manifest;

    let chain = Promise.resolve();

    chain = chain.then(() => this.runPrepublishScripts(rootPkg));
    chain = chain.then(() =>
      pMap(this.updates, ({ pkg }) => {
        this.execScript(pkg, "prepublish");

        return this.runPrepublishScripts(pkg);
      })
    );

    tracker.addWork(this.packagesToPublish.length);

    const mapPackage = pkg => {
      tracker.verbose("publishing", pkg.name);

      return npmPublish(pkg, distTag, this.npmConfig).then(() => {
        tracker.info("published", pkg.name);
        tracker.completeWork(1);

        this.execScript(pkg, "postpublish");

        return this.runPackageLifecycle(pkg, "postpublish");
      });
    };

    chain = chain.then(() => runParallelBatches(this.batchedPackages, this.concurrency, mapPackage));
    chain = chain.then(() => this.runPackageLifecycle(rootPkg, "postpublish"));

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
