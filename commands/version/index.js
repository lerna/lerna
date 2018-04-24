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
const isAnythingCommited = require("./lib/is-anything-committed");

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
    this.gitRemote = this.options.gitRemote;
    this.tagPrefix = this.options.tagVersionPrefix;

    const { amend, commitHooks, signGitCommit, signGitTag } = this.options;

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
    if (!isAnythingCommited(this.execOpts)) {
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
      this.options.gitTagVersion &&
      this.options.pushToRemote &&
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
    const tasks = [() => this.updatePackageVersions()];

    if (this.options.gitTagVersion) {
      tasks.push(() => this.commitAndTagUpdates());
    } else {
      this.logger.info("execute", "Skipping git tag/commit");
    }

    if (this.options.gitTagVersion && !this.options.amend && this.options.pushToRemote) {
      tasks.push(() => this.pushToRemote());
    } else {
      this.logger.info("execute", "Skipping git push");
    }

    return pWaterfall(tasks).then(() => {
      this.logger.success("version", "finished");

      return {
        updates: this.updates,
        updatesVersions: this.updatesVersions,
      };
    });
  }

  getVersionsForUpdates() {
    const { bump, conventionalCommits, preid } = this.options;
    const repoVersion = bump ? semver.clean(bump) : null;
    const increment = bump && !semver.valid(bump) ? bump : null;

    const makeGlobalVersionPredicate = nextVersion => {
      this.globalVersion = nextVersion;

      return () => nextVersion;
    };

    // decide the predicate in the conditionals below
    let predicate;

    if (repoVersion) {
      predicate = makeGlobalVersionPredicate(repoVersion);
    } else if (conventionalCommits) {
      // it's a bit weird to have a return here, true
      return this.recommendVersions();
    } else if (increment) {
      predicate = ({ version }) => semver.inc(version, increment, preid);
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
              "version",
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

    return PromptUtilities.confirm("Are you sure you want to create these versions?");
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
                  // don't overwrite local file: specifiers, they only change during publish
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
        ConventionalCommitUtilities.updateChangelog(this.project.manifest, "root", {
          changelogPreset,
          rootPath,
          version: this.globalVersion,
        }).then(changelogLocation => {
          // commit the updated changelog
          changedFiles.add(changelogLocation);
        })
      );
    }

    if (!independentVersions) {
      this.project.version = this.globalVersion;

      chain = chain.then(() =>
        this.project.serializeConfig().then(lernaConfigLocation => {
          // commit the version update
          changedFiles.add(lernaConfigLocation);
        })
      );
    }

    // exec version lifecycle in root (after all updates)
    chain = chain.then(() => this.runPackageLifecycle(this.project.manifest, "version"));

    if (this.options.gitTagVersion) {
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

  pushToRemote() {
    this.logger.info("git", "Pushing tags...");

    return gitPush(this.gitRemote, this.currentBranch, this.execOpts);
  }
}

module.exports.VersionCommand = VersionCommand;
