"use strict";

const os = require("os");
const chalk = require("chalk");
const dedent = require("dedent");
const minimatch = require("minimatch");
const path = require("path");
const pFinally = require("p-finally");
const pMap = require("p-map");
const pMapSeries = require("p-map-series");
const pReduce = require("p-reduce");
const pWaterfall = require("p-waterfall");
const semver = require("semver");
const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");

const Command = require("../Command");
const ConventionalCommitUtilities = require("../ConventionalCommitUtilities");
const GitUtilities = require("../GitUtilities");
const PromptUtilities = require("../PromptUtilities");
const output = require("../utils/output");
const UpdatedPackagesCollector = require("../UpdatedPackagesCollector");
const npmDistTag = require("../utils/npm-dist-tag");
const npmPublish = require("../utils/npm-publish");
const npmRunScript = require("../utils/npm-run-script");
const batchPackages = require("../utils/batch-packages");
const ValidationError = require("../utils/validation-error");

exports.handler = function handler(argv) {
  // eslint-disable-next-line no-use-before-define
  return new PublishCommand(argv);
};

exports.command = "publish";

exports.describe = "Publish packages in the current project.";

const cdVersionOptions = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"];

const cdVersionOptionString = `'${cdVersionOptions.slice(0, -1).join("', '")}', or '${
  cdVersionOptions[cdVersionOptions.length - 1]
}'.`;

exports.builder = {
  canary: {
    group: "Command Options:",
    defaultDescription: "alpha",
    describe: "Publish packages after every successful merge using the sha as part of the tag.",
    alias: "c",
    // NOTE: this type must remain undefined, as it is too overloaded to make sense
    // type: "string",
  },
  "cd-version": {
    group: "Command Options:",
    describe: `Skip the version selection prompt and increment semver: ${cdVersionOptionString}`,
    type: "string",
    requiresArg: true,
    coerce: choice => {
      if (cdVersionOptions.indexOf(choice) === -1) {
        throw new Error(`--cd-version must be one of: ${cdVersionOptionString}`);
      }
      return choice;
    },
  },
  "conventional-commits": {
    group: "Command Options:",
    describe: "Use angular conventional-commit format to determine version bump and generate CHANGELOG.",
    type: "boolean",
    default: undefined,
  },
  "changelog-preset": {
    group: "Command Options:",
    describe: "Use another conventional-changelog preset rather than angular.",
    type: "string",
    default: undefined,
  },
  exact: {
    group: "Command Options:",
    describe: "Specify cross-dependency version numbers exactly rather than with a caret (^).",
    type: "boolean",
    default: undefined,
  },
  "git-remote": {
    group: "Command Options:",
    defaultDescription: "origin",
    describe: "Push git changes to the specified remote instead of 'origin'.",
    type: "string",
    requiresArg: true,
  },
  yes: {
    group: "Command Options:",
    describe: "Skip all confirmation prompts.",
    type: "boolean",
    default: undefined,
  },
  message: {
    group: "Command Options:",
    describe: "Use a custom commit message when creating the publish commit.",
    alias: "m",
    type: "string",
    requiresArg: true,
  },
  "npm-tag": {
    group: "Command Options:",
    describe: "Publish packages with the specified npm dist-tag",
    type: "string",
    requiresArg: true,
  },
  "npm-client": {
    group: "Command Options:",
    describe: "Executable used to publish dependencies (npm, yarn, pnpm, ...)",
    type: "string",
    requiresArg: true,
  },
  registry: {
    group: "Command Options:",
    describe: "Use the specified registry for all npm client operations.",
    type: "string",
    requiresArg: true,
  },
  preid: {
    group: "Command Options:",
    describe: "Specify the prerelease identifier (major.minor.patch-pre).",
    type: "string",
    requiresArg: true,
  },
  "repo-version": {
    group: "Command Options:",
    describe: "Specify repo version to publish.",
    type: "string",
    requiresArg: true,
  },
  "skip-git": {
    group: "Command Options:",
    describe: "Skip commiting, tagging, and pushing git changes.",
    type: "boolean",
    default: undefined,
  },
  "skip-npm": {
    group: "Command Options:",
    describe: "Stop before actually publishing change to npm.",
    type: "boolean",
    default: undefined,
  },
  "temp-tag": {
    group: "Command Options:",
    describe: "Create a temporary tag while publishing.",
    type: "boolean",
    default: undefined,
  },
  "allow-branch": {
    group: "Command Options:",
    describe: "Specify which branches to allow publishing from.",
    type: "array",
  },
};

class PublishCommand extends Command {
  get defaultOptions() {
    return Object.assign({}, super.defaultOptions, {
      conventionalCommits: false,
      exact: false,
      skipGit: false,
      skipNpm: false,
      tempTag: false,
      yes: false,
      allowBranch: false,
    });
  }

  initialize(callback) {
    this.gitRemote = this.options.gitRemote || "origin";
    this.gitEnabled = !(this.options.canary || this.options.skipGit);

    // https://docs.npmjs.com/misc/config#save-prefix
    this.savePrefix = this.options.exact ? "" : "^";

    this.npmConfig = {
      npmClient: this.options.npmClient || "npm",
      registry: this.options.registry,
    };

    if (this.options.useGitVersion && !this.options.exact) {
      throw new Error(dedent`
        Using git version without 'exact' option is not recommended.
        Please make sure you publish with --exact.
      `);
    }

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

    this.updates = new UpdatedPackagesCollector(this).getUpdates();

    if (!this.updates.length) {
      this.logger.info("No updated packages to publish.");
      return callback(null, false);
    }

    this.packagesToPublish = this.updates.map(({ package: pkg }) => pkg).filter(pkg => !pkg.private);

    this.batchedPackagesToPublish = this.toposort
      ? batchPackages(this.packagesToPublish, {
          // Don't sort based on devDependencies because that would increase the chance of dependency cycles
          // causing less-than-ideal a publishing order.
          graphType: "dependencies",
          rejectCycles: this.options.rejectCycles,
        })
      : [this.packagesToPublish];

    const tasks = [
      () => this.getVersionsForUpdates(),
      versions => {
        this.updatesVersions = versions;
      },
      () => this.confirmVersions(),
    ];

    return pWaterfall(tasks)
      .then(proceed => callback(null, proceed))
      .catch(callback);
  }

  execute(callback) {
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

    pWaterfall(tasks)
      .then(() => callback(null, true))
      .catch(callback);
  }

  resolveLocalDependencyLinks() {
    // resolve relative file: links to their actual version range
    const updatesWithLocalLinks = this.updates
      .map(({ package: pkg }) => this.packageGraph.get(pkg.name))
      .filter(
        ({ localDependencies }) =>
          localDependencies.size &&
          Array.from(localDependencies.values()).some(({ type }) => type === "directory")
      );

    return pMap(updatesWithLocalLinks, ({ pkg, localDependencies }) => {
      // create a copy of the serialized JSON with resolved local links
      const updated = Array.from(localDependencies.keys()).reduce((obj, linkedName) => {
        // regardless of where the version comes from, we can't publish "file:../sibling-pkg" specs
        const version = this.updatesVersions.get(linkedName) || this.packageGraph.get(linkedName).pkg.version;

        // we only care about dependencies here, as devDependencies are ignored when installed
        obj.dependencies[linkedName] = `${this.savePrefix}${version}`;

        return obj;
      }, pkg.toJSON()); // don't mutate shared Package instance

      return writePkg(pkg.manifestLocation, updated).then(() => pkg);
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
    const iterator = (versionMap, { package: pkg }) =>
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

        this.updates.forEach(({ package: pkg }) => {
          if (semver.lt(pkg.version, globalVersion)) {
            this.logger.verbose(
              "publish",
              `Overriding version of ${pkg.name} from ${pkg.version} to ${globalVersion}`
            );

            pkg.version = globalVersion;
          }
        });
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
    const changes = this.updates.map(({ package: pkg }) => {
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

  runLifecycle(pkg, scriptName) {
    if (pkg.scripts[scriptName]) {
      return npmRunScript(scriptName, {
        args: ["--silent"],
        npmClient: this.npmConfig.npmClient,
        pkg,
      }).catch(err => {
        this.logger.error("publish", `error running ${scriptName} in ${pkg.name}\n`, err.stack || err);
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
    chain = chain.then(() => this.runLifecycle(rootPkg, "preversion"));

    chain = chain.then(() =>
      pMap(
        this.updates,
        ({ package: pkg }) =>
          // start the chain
          Promise.resolve()

            // exec preversion script
            .then(() => this.runLifecycle(pkg, "preversion"))

            // write new package
            .then(() => {
              // set new version
              pkg.version = this.updatesVersions.get(pkg.name);

              // update pkg dependencies
              this.packageGraph.get(pkg.name).localDependencies.forEach(({ type }, depName) => {
                if (type === "directory") {
                  // don't overwrite local file: specifiers (yet)
                  return;
                }

                const depVersion = this.updatesVersions.get(depName);

                if (depVersion) {
                  pkg.setDependencyVersion("dependencies", depName, depVersion, this.savePrefix);
                  pkg.setDependencyVersion("devDependencies", depName, depVersion, this.savePrefix);
                }
              });

              // NOTE: Object.prototype.toJSON() is normally called when passed to
              // JSON.stringify(), but write-pkg iterates Object.keys() before serializing
              // so it has to be explicit here (otherwise it mangles the instance properties)
              return writePkg(pkg.manifestLocation, pkg.toJSON()).then(() => {
                // commit the updated manifest
                changedFiles.add(pkg.manifestLocation);
              });
            })

            // exec version script
            .then(() => this.runLifecycle(pkg, "version"))

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
    chain = chain.then(() => this.runLifecycle(rootPkg, "version"));

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
    chain = chain.then(() => {
      this.updates.forEach(({ package: pkg }) => this.runLifecycle(pkg, "postversion"));
    });

    // run postversion, if set, in the root directory
    chain = chain.then(() => this.runLifecycle(this.repository.package, "postversion"));

    return chain;
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map(({ package: pkg }) => `${pkg.name}@${this.updatesVersions.get(pkg.name)}`);
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

    this.updates.forEach(({ package: pkg }) => this.execScript(pkg, "prepublish"));

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

    return pFinally(
      pMapSeries(this.batchedPackagesToPublish, batch =>
        pMap(batch, mapPackage, { concurrency: this.concurrency })
      ),
      () => tracker.finish()
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

    return pFinally(
      pMapSeries(this.batchedPackagesToPublish, batch =>
        pMap(batch, mapPackage, { concurrency: this.concurrency })
      ),
      () => tracker.finish()
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
