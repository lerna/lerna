"use strict";

const os = require("os");
const chalk = require("chalk");
const dedent = require("dedent");
const minimatch = require("minimatch");
const pMap = require("p-map");
const pReduce = require("p-reduce");
const pWaterfall = require("p-waterfall");
const semver = require("semver");

const Command = require("@lerna/command");
const ConventionalCommitUtilities = require("@lerna/conventional-commits");
const PromptUtilities = require("@lerna/prompt");
const output = require("@lerna/output");
const collectUpdates = require("@lerna/collect-updates");
const { createRunner } = require("@lerna/run-lifecycle");
const ValidationError = require("@lerna/validation-error");

const getCurrentBranch = require("./lib/get-current-branch");
const gitAdd = require("./lib/git-add");
const gitCommit = require("./lib/git-commit");
const gitPush = require("./lib/git-push");
const gitTag = require("./lib/git-tag");
const isBehindUpstream = require("./lib/is-behind-upstream");
const isBreakingChange = require("./lib/is-breaking-change");
const isAnythingCommitted = require("./lib/is-anything-committed");
const promptVersion = require("./lib/prompt-version");

module.exports = factory;

function factory(argv) {
  return new VersionCommand(argv);
}

class VersionCommand extends Command {
  get otherCommandConfigs() {
    // back-compat
    return ["publish"];
  }

  initialize() {
    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      amend,
      commitHooks = true,
      gitRemote = "origin",
      gitTagVersion = true,
      push = true,
      signGitCommit,
      signGitTag,
      tagVersionPrefix = "v",
    } = this.options;

    this.gitRemote = gitRemote;
    this.tagPrefix = tagVersionPrefix;
    this.commitAndTag = gitTagVersion;
    this.pushToRemote = gitTagVersion && amend !== true && push;
    // never automatically push to remote when amending a commit

    this.gitOpts = {
      amend,
      commitHooks,
      signGitCommit,
      signGitTag,
    };

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    if (!this.project.isIndependent()) {
      this.logger.info("current version", this.project.version);
    }

    // git validation, if enabled, should happen before updates are calculated and versions picked
    if (!isAnythingCommitted(this.execOpts)) {
      throw new ValidationError(
        "ENOCOMMIT",
        "No commits in this repository. Please commit something before using version."
      );
    }

    this.currentBranch = getCurrentBranch(this.execOpts);

    if (this.currentBranch === "HEAD") {
      throw new ValidationError("ENOGIT", "Detached git HEAD, please checkout a branch to choose versions.");
    }

    if (
      this.options.allowBranch &&
      ![].concat(this.options.allowBranch).some(x => minimatch(this.currentBranch, x))
    ) {
      throw new ValidationError(
        "ENOTALLOWED",
        dedent`
          Branch '${this.currentBranch}' is restricted from versioning due to allowBranch config.
          Please consider the reasons for this restriction before overriding the option.
        `
      );
    }

    if (
      this.commitAndTag &&
      this.pushToRemote &&
      isBehindUpstream(this.gitRemote, this.currentBranch, this.execOpts)
    ) {
      const message = `Local branch '${this.currentBranch}' is behind remote upstream ${this.gitRemote}/${
        this.currentBranch
      }`;

      if (!this.options.ci) {
        // interrupt interactive execution
        throw new ValidationError(
          "EBEHIND",
          dedent`
            ${message}
            Please merge remote changes into '${this.currentBranch}' with 'git pull'
          `
        );
      }

      // CI execution should not error, but warn & exit
      this.logger.warn("EBEHIND", `${message}, exiting`);

      // still exits zero, aka "ok"
      return false;
    }

    this.updates = collectUpdates(this.filteredPackages, this.packageGraph, this.execOpts, this.options);

    if (!this.updates.length) {
      this.logger.success("No updated packages to version");

      // still exits zero, aka "ok"
      return false;
    }

    this.runPackageLifecycle = createRunner(this.options);

    return pWaterfall([
      () => this.getVersionsForUpdates(),
      versions => {
        if (this.project.isIndependent() || versions.size === this.filteredPackages.size) {
          // only partial fixed versions need to be checked
          this.updatesVersions = versions;
        } else {
          let hasBreakingChange;

          for (const [name, bump] of versions) {
            hasBreakingChange =
              hasBreakingChange || isBreakingChange(this.packageGraph.get(name).version, bump);
          }

          if (hasBreakingChange) {
            const packages =
              this.filteredPackages.length === this.packageGraph.size
                ? this.packageGraph
                : new Map(this.filteredPackages.map(({ name }) => [name, this.packageGraph.get(name)]));

            this.updates = Array.from(packages.values());
            this.updatesVersions = new Map(this.updates.map(({ name }) => [name, this.globalVersion]));
          } else {
            this.updatesVersions = versions;
          }
        }
      },
      () => this.confirmVersions(),
    ]);
  }

  execute() {
    let chain = Promise.resolve();
    const changedFilesPromise = this.updatePackageVersions();
    chain = chain.then(() => changedFilesPromise);

    // Ask for confirmation to commit
    const confirmedGitCommitPromise = chain
      .then(() => changedFilesPromise)
      .then(changedFiles => (this.commitAndTag ? this.confirmGitCommit(changedFiles) : false));

    if (this.commitAndTag) {
      // If user aggreed - add files
      const addFilesToGitPromise = Promise.all([confirmedGitCommitPromise, changedFilesPromise, chain]).then(
        ([confimredCommit, changedFiles]) => {
          if (confimredCommit) {
            gitAdd(changedFiles, this.execOpts);
          }
        }
      );
      // If user aggreed commit and tag files
      const commitAndTagFilesPromise = addFilesToGitPromise
        .then(() => confirmedGitCommitPromise)
        .then(confimredCommit => confimredCommit && this.commitAndTagUpdates());
      chain = chain.then(() => commitAndTagFilesPromise);
    } else {
      this.logger.info("execute", "Skipping git tag/commit");
    }

    if (this.pushToRemote) {
      // Ask for confirmation to push (if the user aggreed to commit)
      const confirmedGitPushPromise = chain
        .then(() => confirmedGitCommitPromise)
        .then(confimredCommit => confimredCommit && this.confirmGitPush());
      // If user aggreed push changes
      chain = chain
        .then(() => confirmedGitPushPromise)
        .then(comfirmedPush => comfirmedPush && this.gitPushToRemote());
    } else {
      this.logger.info("execute", "Skipping git push");
    }

    return chain.then(() => {
      this.logger.success("version", "finished");

      return {
        updates: this.updates,
        updatesVersions: this.updatesVersions,
      };
    });
  }

  getVersionsForUpdates() {
    const independentVersions = this.project.isIndependent();
    const { bump, conventionalCommits, preid } = this.options;
    const repoVersion = bump ? semver.clean(bump) : "";
    const increment = bump && !semver.valid(bump) ? bump : "";
    const isPrerelease = increment.startsWith("pre");

    const resolvePrereleaseId = existingPreid => (isPrerelease && existingPreid) || preid || "alpha";

    const makeGlobalVersionPredicate = nextVersion => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(repoVersion);
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = node => semver.inc(node.version, increment, resolvePrereleaseId(node.prereleaseId));
    } else if (increment) {
      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = (semver.prerelease(this.project.version) || []).shift();
      const nextVersion = semver.inc(this.project.version, increment, resolvePrereleaseId(prereleaseId));

      predicate = makeGlobalVersionPredicate(nextVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions();
    } else if (independentVersions) {
      predicate = promptVersion;
    } else {
      predicate = promptVersion(this.project).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then(getVersion => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion) {
    const iterator = (versionMap, node) =>
      Promise.resolve(getVersion(node)).then(version => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  recommendVersions() {
    const independentVersions = this.project.isIndependent();
    const { changelogPreset } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? "independent" : "fixed";

    let chain = Promise.resolve();

    if (type === "fixed") {
      chain = chain.then(() => this.setGlobalVersionFloor());
    }

    chain = chain.then(() =>
      this.reduceVersions(node =>
        ConventionalCommitUtilities.recommendVersion(node, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
        })
      )
    );

    if (type === "fixed") {
      chain = chain.then(versions => {
        this.globalVersion = this.setGlobalVersionCeiling(versions);

        return versions;
      });
    }

    return chain;
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const { pkg } of this.updates) {
      if (semver.lt(pkg.version, globalVersion)) {
        this.logger.verbose(
          "version",
          `Overriding version of ${pkg.name} from ${pkg.version} to ${globalVersion}`
        );

        pkg.version = globalVersion;
      }
    }
  }

  setGlobalVersionCeiling(versions) {
    let highestVersion = this.project.version;

    versions.forEach(bump => {
      if (semver.gt(bump, highestVersion)) {
        highestVersion = bump;
      }
    });

    versions.forEach((_, name) => versions.set(name, highestVersion));

    return highestVersion;
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

    return PromptUtilities.confirm("Are you sure you want to create these versions?");
  }

  confirmGitCommit(changedFiles) {
    const changes = changedFiles.map(filename => ` - ${filename}`);

    output("");
    output("Changed files:");
    output(changes.join(os.EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }
    return PromptUtilities.confirm(
      "Are you sure you want to create a commit out of the above version updates?"
    );
  }

  confirmGitPush() {
    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }
    return PromptUtilities.confirm("Are you sure you want to push your git changes?");
  }

  confirmNpmPublish() {
    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      return true;
    }
    return PromptUtilities.confirm("Are you sure you want to publish your changes on npm?");
  }

  updatePackageVersions() {
    const { conventionalCommits, changelogPreset } = this.options;
    const independentVersions = this.project.isIndependent();
    const rootPath = this.project.manifest.location;
    const changedFiles = new Set();

    // my kingdom for async await :(
    let chain = Promise.resolve();

    // preversion:  Run BEFORE bumping the package version.
    // version:     Run AFTER bumping the package version, but BEFORE commit.
    // postversion: Run AFTER bumping the package version, and AFTER commit.
    // @see https://docs.npmjs.com/misc/scripts

    // exec preversion lifecycle in root (before all updates)
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "preversion"));

    chain = chain.then(() => {
      const mapUpdate = ({ pkg, localDependencies }) => {
        // start the chain
        let tasks = Promise.resolve();

        // exec preversion script
        tasks = tasks.then(() => this.runPackageLifecycle(pkg, "preversion"));

        // write new package
        tasks = tasks.then(() => {
          // set new version
          pkg.version = this.updatesVersions.get(pkg.name);

          // update pkg dependencies
          for (const [depName, resolved] of localDependencies) {
            const depVersion = this.updatesVersions.get(depName);

            if (depVersion && resolved.type !== "directory") {
              // don't overwrite local file: specifiers, they only change during publish
              pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
            }
          }

          return pkg.serialize().then(() => {
            // commit the updated manifest
            changedFiles.add(pkg.manifestLocation);
          });
        });

        // exec version script
        tasks = tasks.then(() => this.runPackageLifecycle(pkg, "version"));

        if (conventionalCommits) {
          tasks = tasks.then(() => {
            // we can now generate the Changelog, based on the
            // the updated version that we're about to release.
            const type = independentVersions ? "independent" : "fixed";

            return ConventionalCommitUtilities.updateChangelog(pkg, type, {
              changelogPreset,
              rootPath,
              tagPrefix: this.tagPrefix,
            }).then(changelogLocation => {
              // commit the updated changelog
              changedFiles.add(changelogLocation);
            });
          });
        }

        return tasks;
      };

      // TODO: tune the concurrency?
      return pMap(this.updates, mapUpdate, { concurrency: 100 });
    });

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      if (conventionalCommits) {
        chain = chain.then(() =>
          ConventionalCommitUtilities.updateChangelog(this.project.manifest, "root", {
            changelogPreset,
            rootPath,
            tagPrefix: this.tagPrefix,
            version: this.globalVersion,
          }).then(changelogLocation => {
            // commit the updated changelog
            changedFiles.add(changelogLocation);
          })
        );
      }

      chain = chain.then(() =>
        this.project.serializeConfig().then(lernaConfigLocation => {
          // commit the version update
          changedFiles.add(lernaConfigLocation);
        })
      );
    }

    // exec version lifecycle in root (after all updates)
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "version"));

    return chain.then(() => Array.from(changedFiles));
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
      .then(() => gitCommit(message, this.gitOpts, this.execOpts))
      .then(() => Promise.all(tags.map(tag => gitTag(tag, this.gitOpts, this.execOpts))))
      .then(() => tags);
  }

  gitCommitAndTagVersion() {
    const version = this.globalVersion;
    const tag = `${this.tagPrefix}${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    return Promise.resolve()
      .then(() => gitCommit(message, this.gitOpts, this.execOpts))
      .then(() => gitTag(tag, this.gitOpts, this.execOpts))
      .then(() => [tag]);
  }

  gitPushToRemote() {
    this.logger.info("git", "Pushing tags...");

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts);
  }
}

module.exports.VersionCommand = VersionCommand;
