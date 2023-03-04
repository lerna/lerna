// TODO: refactor based on TS feedback
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  applyBuildMetadata,
  checkWorkingTree,
  collectPackages,
  collectUpdates,
  Command,
  createRunner,
  getPackagesForOption,
  output,
  prereleaseIdFromVersion,
  promptConfirmation,
  recommendVersion,
  runTopologically,
  throwIfUncommitted,
  updateChangelog,
  ValidationError,
} from "@lerna/core";
import chalk from "chalk";
import dedent from "dedent";
import fs from "fs";
import minimatch from "minimatch";
import os from "os";
import pMap from "p-map";
import pPipe from "p-pipe";
import pReduce from "p-reduce";
import pWaterfall from "p-waterfall";
import path from "path";
import semver from "semver";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getCurrentBranch } = require("./lib/get-current-branch");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitAdd } = require("./lib/git-add");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitCommit } = require("./lib/git-commit");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitPush } = require("./lib/git-push");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { gitTag } = require("./lib/git-tag");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isBehindUpstream } = require("./lib/is-behind-upstream");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { remoteBranchExists } = require("./lib/remote-branch-exists");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isBreakingChange } = require("./lib/is-breaking-change");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { isAnythingCommitted } = require("./lib/is-anything-committed");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { makePromptVersion } = require("./lib/prompt-version");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createRelease, createReleaseClient } = require("./lib/create-release");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { updateLockfileVersion } = require("./lib/update-lockfile-version");

module.exports = function factory(argv: NodeJS.Process["argv"]) {
  return new VersionCommand(argv);
};

class VersionCommand extends Command {
  get otherCommandConfigs() {
    // back-compat
    return ["publish"];
  }

  get requiresGit() {
    return (
      this.commitAndTag || this.pushToRemote || this.options.allowBranch || this.options.conventionalCommits
    );
  }

  configureProperties() {
    super.configureProperties();

    // Defaults are necessary here because yargs defaults
    // override durable options provided by a config file
    const {
      amend,
      commitHooks = true,
      gitRemote = "origin",
      gitTagVersion = true,
      granularPathspec = true,
      push = true,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
      tagVersionPrefix = "v",
    } = this.options;

    this.gitRemote = gitRemote;
    this.tagPrefix = tagVersionPrefix;
    this.commitAndTag = gitTagVersion;
    this.pushToRemote = gitTagVersion && amend !== true && push;
    // never automatically push to remote when amending a commit

    this.releaseClient =
      this.pushToRemote && this.options.createRelease && createReleaseClient(this.options.createRelease);
    this.releaseNotes = [];

    if (this.releaseClient && this.options.conventionalCommits !== true) {
      throw new ValidationError("ERELEASE", "To create a release, you must enable --conventional-commits");
    }

    if (this.releaseClient && this.options.changelog === false) {
      throw new ValidationError("ERELEASE", "To create a release, you cannot pass --no-changelog");
    }

    this.gitOpts = {
      amend,
      commitHooks,
      granularPathspec,
      signGitCommit,
      signoffGitCommit,
      signGitTag,
      forceGitTag,
    };

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";
  }

  initialize() {
    if (!this.project.isIndependent()) {
      this.logger.info("current version", this.project.version);
    }

    if (this.requiresGit) {
      // git validation, if enabled, should happen before updates are calculated and versions picked
      if (!isAnythingCommitted(this.execOpts)) {
        throw new ValidationError(
          "ENOCOMMIT",
          "No commits in this repository. Please commit something before using version."
        );
      }

      this.currentBranch = getCurrentBranch(this.execOpts);

      if (this.currentBranch === "HEAD") {
        throw new ValidationError(
          "ENOGIT",
          "Detached git HEAD, please checkout a branch to choose versions."
        );
      }

      if (this.pushToRemote && !remoteBranchExists(this.gitRemote, this.currentBranch, this.execOpts)) {
        throw new ValidationError(
          "ENOREMOTEBRANCH",
          dedent`
            Branch '${this.currentBranch}' doesn't exist in remote '${this.gitRemote}'.
            If this is a new branch, please make sure you push it to the remote first.
          `
        );
      }

      if (
        this.options.allowBranch &&
        ![].concat(this.options.allowBranch).some((x) => minimatch(this.currentBranch, x))
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
        // eslint-disable-next-line max-len
        const message = `Local branch '${this.currentBranch}' is behind remote upstream ${this.gitRemote}/${this.currentBranch}`;

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
    } else {
      this.logger.notice(
        "FYI",
        "git repository validation has been skipped, please ensure your version bumps are correct"
      );
    }

    if (this.options.conventionalPrerelease && this.options.conventionalGraduate) {
      throw new ValidationError(
        "ENOTALLOWED",
        dedent`
          --conventional-prerelease cannot be combined with --conventional-graduate.
        `
      );
    }

    this.updates = collectUpdates(
      this.packageGraph.rawPackageList,
      this.packageGraph,
      this.execOpts,
      this.options
    ).filter((node) => {
      // --no-private completely removes private packages from consideration
      if (node.pkg.private && this.options.private === false) {
        // TODO: (major) make --no-private the default
        return false;
      }

      if (!node.version) {
        // a package may be unversioned only if it is private
        if (node.pkg.private) {
          this.logger.info("version", "Skipping unversioned private package %j", node.name);
        } else {
          throw new ValidationError(
            "ENOVERSION",
            dedent`
              A version field is required in ${node.name}'s package.json file.
              If you wish to keep the package unversioned, it must be made private.
            `
          );
        }
      }

      return !!node.version;
    });

    if (!this.updates.length) {
      this.logger.success(`No changed packages to ${this.composed ? "publish" : "version"}`);

      // still exits zero, aka "ok"
      return false;
    }

    // a "rooted leaf" is the regrettable pattern of adding "." to the "packages" config in lerna.json
    this.hasRootedLeaf = this.packageGraph.has(this.project.manifest.name);

    if (this.hasRootedLeaf && !this.composed) {
      this.logger.info("version", "rooted leaf detected, skipping synthetic root lifecycles");
    }

    this.runPackageLifecycle = createRunner({ ...this.options, stdio: "inherit" });

    // don't execute recursively if run from a poorly-named script
    this.runRootLifecycle = /^(pre|post)?version$/.test(process.env.npm_lifecycle_event)
      ? (stage) => {
          this.logger.warn("lifecycle", "Skipping root %j because it has already been called", stage);
        }
      : (stage) => this.runPackageLifecycle(this.project.manifest, stage);

    const tasks = [
      () => this.getVersionsForUpdates(),
      (versions) => this.setUpdatesForVersions(versions),
      () => this.confirmVersions(),
    ];

    // amending a commit probably means the working tree is dirty
    if (this.commitAndTag && this.gitOpts.amend !== true) {
      const { forcePublish, conventionalCommits, conventionalGraduate } = this.options;
      const checkUncommittedOnly = forcePublish || (conventionalCommits && conventionalGraduate);
      const check = checkUncommittedOnly ? throwIfUncommitted : checkWorkingTree;
      tasks.unshift(() => check(this.execOpts));
    } else {
      this.logger.warn("version", "Skipping working tree validation, proceed at your own risk");
    }

    return pWaterfall(tasks);
  }

  execute() {
    const tasks = [() => this.updatePackageVersions()];

    if (this.commitAndTag) {
      tasks.push(() => this.commitAndTagUpdates());
    } else {
      this.logger.info("execute", "Skipping git tag/commit");
    }

    if (this.pushToRemote) {
      tasks.push(() => this.gitPushToRemote());
    } else {
      this.logger.info("execute", "Skipping git push");
    }

    if (this.releaseClient) {
      this.logger.info("execute", "Creating releases...");
      tasks.push(() =>
        createRelease(
          this.releaseClient,
          { tags: this.tags, releaseNotes: this.releaseNotes },
          { gitRemote: this.options.gitRemote, execOpts: this.execOpts }
        )
      );
    } else {
      this.logger.info("execute", "Skipping releases");
    }

    return pWaterfall(tasks).then(() => {
      if (!this.composed) {
        this.logger.success("version", "finished");
      }

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

    const resolvePrereleaseId = (existingPreid) => preid || existingPreid || "alpha";

    const makeGlobalVersionPredicate = (nextVersion) => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(applyBuildMetadata(repoVersion, this.options.buildMetadata));
    } else if (increment && independentVersions) {
      // compute potential prerelease ID for each independent update
      predicate = (node) =>
        applyBuildMetadata(
          semver.inc(node.version, increment, resolvePrereleaseId(node.prereleaseId)),
          this.options.buildMetadata
        );
    } else if (increment) {
      // compute potential prerelease ID once for all fixed updates
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const nextVersion = applyBuildMetadata(
        semver.inc(this.project.version, increment, resolvePrereleaseId(prereleaseId)),
        this.options.buildMetadata
      );

      predicate = makeGlobalVersionPredicate(nextVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions(resolvePrereleaseId);
    } else if (independentVersions) {
      // prompt for each independent update with potential prerelease ID
      predicate = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
    } else {
      // prompt once with potential prerelease ID
      const prereleaseId = prereleaseIdFromVersion(this.project.version);
      const node = { version: this.project.version, prereleaseId };

      predicate = makePromptVersion(resolvePrereleaseId, this.options.buildMetadata);
      predicate = predicate(node).then(makeGlobalVersionPredicate);
    }

    return Promise.resolve(predicate).then((getVersion) => this.reduceVersions(getVersion));
  }

  reduceVersions(getVersion) {
    const iterator = (versionMap, node) =>
      Promise.resolve(getVersion(node)).then((version) => versionMap.set(node.name, version));

    return pReduce(this.updates, iterator, new Map());
  }

  getPrereleasePackageNames() {
    const prereleasePackageNames = getPackagesForOption(this.options.conventionalPrerelease);
    const isCandidate = prereleasePackageNames.has("*")
      ? () => true
      : (node, name) => prereleasePackageNames.has(name);

    return collectPackages(this.packageGraph, { isCandidate }).map((pkg) => pkg.name);
  }

  recommendVersions(resolvePrereleaseId) {
    const independentVersions = this.project.isIndependent();
    const { buildMetadata, changelogPreset, conventionalGraduate, conventionalBumpPrerelease } = this.options;
    const rootPath = this.project.manifest.location;
    const type = independentVersions ? "independent" : "fixed";
    const prereleasePackageNames = this.getPrereleasePackageNames();
    const graduatePackageNames = Array.from(getPackagesForOption(conventionalGraduate));
    const shouldPrerelease = (name) => prereleasePackageNames && prereleasePackageNames.includes(name);
    const shouldGraduate = (name) =>
      graduatePackageNames.includes("*") || graduatePackageNames.includes(name);
    const getPrereleaseId = (node) => {
      if (!shouldGraduate(node.name) && (shouldPrerelease(node.name) || node.prereleaseId)) {
        return resolvePrereleaseId(node.prereleaseId);
      }
    };

    let chain = Promise.resolve();

    if (type === "fixed") {
      chain = chain.then(() => this.setGlobalVersionFloor());
    }

    chain = chain.then(() =>
      this.reduceVersions((node) =>
        recommendVersion(node, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
          prereleaseId: getPrereleaseId(node),
          conventionalBumpPrerelease,
          buildMetadata,
        })
      )
    );

    if (type === "fixed") {
      chain = chain.then((versions) => {
        this.globalVersion = this.setGlobalVersionCeiling(versions);

        return versions;
      });
    }

    return chain;
  }

  setGlobalVersionFloor() {
    const globalVersion = this.project.version;

    for (const node of this.updates) {
      if (semver.lt(node.version, globalVersion)) {
        this.logger.verbose(
          "version",
          `Overriding version of ${node.name} from ${node.version} to ${globalVersion}`
        );

        node.pkg.set("version", globalVersion);
      }
    }
  }

  setGlobalVersionCeiling(versions) {
    let highestVersion = this.project.version;

    versions.forEach((bump) => {
      if (bump && semver.gt(bump, highestVersion)) {
        highestVersion = bump;
      }
    });

    versions.forEach((_, name) => versions.set(name, highestVersion));

    return highestVersion;
  }

  setUpdatesForVersions(versions) {
    if (this.project.isIndependent() || versions.size === this.packageGraph.size) {
      // only partial fixed versions need to be checked
      this.updatesVersions = versions;
    } else {
      let hasBreakingChange;

      for (const [name, bump] of versions) {
        hasBreakingChange = hasBreakingChange || isBreakingChange(this.packageGraph.get(name).version, bump);
      }

      if (hasBreakingChange) {
        // _all_ packages need a major version bump whenever _any_ package does
        this.updates = Array.from(this.packageGraph.values());

        // --no-private completely removes private packages from consideration
        if (this.options.private === false) {
          // TODO: (major) make --no-private the default
          this.updates = this.updates.filter((node) => !node.pkg.private);
        }

        this.updatesVersions = new Map(this.updates.map((node) => [node.name, this.globalVersion]));
      } else {
        this.updatesVersions = versions;
      }
    }

    this.packagesToVersion = this.updates.map((node) => node.pkg);
  }

  confirmVersions() {
    const changes = this.packagesToVersion.map((pkg) => {
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

    // When composed from `lerna publish`, use this opportunity to confirm publishing
    const message = this.composed
      ? "Are you sure you want to publish these packages?"
      : "Are you sure you want to create these versions?";

    return promptConfirmation(message);
  }

  updatePackageVersions() {
    const { conventionalCommits, changelogPreset, changelog = true } = this.options;
    const independentVersions = this.project.isIndependent();
    const rootPath = this.project.manifest.location;
    const changedFiles = new Set();

    // my kingdom for async await :(
    let chain = Promise.resolve();

    // preversion:  Run BEFORE bumping the package version.
    // version:     Run AFTER bumping the package version, but BEFORE commit.
    // postversion: Run AFTER bumping the package version, and AFTER commit.
    // @see https://docs.npmjs.com/misc/scripts

    if (!this.hasRootedLeaf) {
      // exec preversion lifecycle in root (before all updates)
      chain = chain.then(() => this.runRootLifecycle("preversion"));
    }

    const actions = [
      (pkg) => this.runPackageLifecycle(pkg, "preversion").then(() => pkg),
      // manifest may be mutated by any previous lifecycle
      (pkg) => pkg.refresh(),
      (pkg) => {
        // set new version
        pkg.set("version", this.updatesVersions.get(pkg.name));

        // update pkg dependencies
        for (const [depName, resolved] of this.packageGraph.get(pkg.name).localDependencies) {
          const depVersion = this.updatesVersions.get(depName);

          if (depVersion && resolved.type !== "directory") {
            // don't overwrite local file: specifiers, they only change during publish
            pkg.updateLocalDependency(resolved, depVersion, this.savePrefix);
          }
        }

        return Promise.all([updateLockfileVersion(pkg), pkg.serialize()]).then(([lockfilePath]) => {
          // commit the updated manifest
          changedFiles.add(pkg.manifestLocation);

          if (lockfilePath) {
            changedFiles.add(lockfilePath);
          }

          return pkg;
        });
      },
      (pkg) => this.runPackageLifecycle(pkg, "version").then(() => pkg),
    ];

    if (conventionalCommits && changelog) {
      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      const type = independentVersions ? "independent" : "fixed";

      actions.push((pkg) =>
        updateChangelog(pkg, type, {
          changelogPreset,
          rootPath,
          tagPrefix: this.tagPrefix,
        }).then(({ logPath, newEntry }) => {
          // commit the updated changelog
          changedFiles.add(logPath);

          // add release notes
          if (independentVersions) {
            this.releaseNotes.push({
              name: pkg.name,
              notes: newEntry,
            });
          }

          return pkg;
        })
      );
    }

    const mapUpdate = pPipe(...actions);

    chain = chain.then(() =>
      runTopologically(this.packagesToVersion, mapUpdate, {
        concurrency: this.concurrency,
        rejectCycles: this.options.rejectCycles,
      })
    );

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      if (conventionalCommits && changelog) {
        chain = chain.then(() =>
          updateChangelog(this.project.manifest, "root", {
            changelogPreset,
            rootPath,
            tagPrefix: this.tagPrefix,
            version: this.globalVersion,
          }).then(({ logPath, newEntry }) => {
            // commit the updated changelog
            changedFiles.add(logPath);

            // add release notes
            this.releaseNotes.push({
              name: "fixed",
              notes: newEntry,
            });
          })
        );
      }

      chain = chain.then(() =>
        Promise.resolve(this.project.serializeConfig()).then((lernaConfigLocation) => {
          // commit the version update
          changedFiles.add(lernaConfigLocation);
        })
      );
    }

    const npmClientArgsRaw = this.options.npmClientArgs || [];
    const npmClientArgs = npmClientArgsRaw.reduce((args, arg) => args.concat(arg.split(/\s|,/)), []);

    if (this.options.npmClient === "pnpm") {
      chain = chain.then(() => {
        this.logger.verbose("version", "Updating root pnpm-lock.yaml");
        return childProcess
          .exec("pnpm", ["install", "--lockfile-only", "--ignore-scripts", ...npmClientArgs], this.execOpts)
          .then(() => {
            const lockfilePath = path.join(this.project.rootPath, "pnpm-lock.yaml");
            changedFiles.add(lockfilePath);
          });
      });
    }

    if (this.options.npmClient === "yarn") {
      chain = chain
        .then(() => childProcess.execSync("yarn", ["--version"], this.execOpts))
        .then((yarnVersion) => {
          this.logger.verbose("version", `Detected yarn version ${yarnVersion}`);

          if (semver.gte(yarnVersion, "2.0.0")) {
            this.logger.verbose("version", "Updating root yarn.lock");
            return childProcess
              .exec("yarn", ["install", "--mode", "update-lockfile", ...npmClientArgs], {
                ...this.execOpts,
                env: {
                  ...process.env,
                  YARN_ENABLE_SCRIPTS: false,
                },
              })
              .then(() => {
                const lockfilePath = path.join(this.project.rootPath, "yarn.lock");
                changedFiles.add(lockfilePath);
              });
          }
        });
    }

    if (this.options.npmClient === "npm" || !this.options.npmClient) {
      const lockfilePath = path.join(this.project.rootPath, "package-lock.json");
      if (fs.existsSync(lockfilePath)) {
        chain = chain.then(() => {
          this.logger.verbose("version", "Updating root package-lock.json");
          return childProcess
            .exec(
              "npm",
              ["install", "--package-lock-only", "--ignore-scripts", ...npmClientArgs],
              this.execOpts
            )
            .then(() => {
              changedFiles.add(lockfilePath);
            });
        });
      }
    }

    if (!this.hasRootedLeaf) {
      // exec version lifecycle in root (after all updates)
      chain = chain.then(() => this.runRootLifecycle("version"));
    }

    if (this.commitAndTag) {
      chain = chain.then(() => gitAdd(Array.from(changedFiles), this.gitOpts, this.execOpts));
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

    chain = chain.then((tags) => {
      this.tags = tags;
    });

    // run the postversion script for each update
    chain = chain.then(() =>
      pMap(this.packagesToVersion, (pkg) => this.runPackageLifecycle(pkg, "postversion"))
    );

    if (!this.hasRootedLeaf) {
      // run postversion, if set, in the root directory
      chain = chain.then(() => this.runRootLifecycle("postversion"));
    }

    return chain;
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.packagesToVersion.map((pkg) => `${pkg.name}@${this.updatesVersions.get(pkg.name)}`);
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    return Promise.resolve()
      .then(() => gitCommit(message, this.gitOpts, this.execOpts))
      .then(() =>
        Promise.all(tags.map((tag) => gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand)))
      )
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
      .then(() => gitTag(tag, this.gitOpts, this.execOpts, this.options.gitTagCommand))
      .then(() => [tag]);
  }

  gitPushToRemote() {
    this.logger.info("git", "Pushing tags...");

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts);
  }
}

module.exports.VersionCommand = VersionCommand;
