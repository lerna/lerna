"use strict";

const os = require("os");
const async = require("async");
const chalk = require("chalk");
const dedent = require("dedent");
const minimatch = require("minimatch");
const path = require("path");
const semver = require("semver");
const writeJsonFile = require("write-json-file");
const writePkg = require("write-pkg");

const Command = require("../Command");
const ConventionalCommitUtilities = require("../ConventionalCommitUtilities");
const FileSystemUtilities = require("../FileSystemUtilities");
const GitUtilities = require("../GitUtilities");
const NpmUtilities = require("../NpmUtilities");
const output = require("../utils/output");
const PackageUtilities = require("../PackageUtilities");
const PromptUtilities = require("../PromptUtilities");
const UpdatedPackagesCollector = require("../UpdatedPackagesCollector");
const ValidationError = require("../utils/ValidationError");

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

  get changelogOpts() {
    if (!this._changelogOpts) {
      const { changelogPreset } = this.options;

      this._changelogOpts = Object.assign({}, this.execOpts, {
        changelogPreset,
      });
    }

    return this._changelogOpts;
  }

  initialize(callback) {
    this.gitRemote = this.options.gitRemote || "origin";
    this.gitEnabled = !(this.options.canary || this.options.skipGit);

    this.npmConfig = {
      npmClient: this.options.npmClient || "npm",
      registry: this.npmRegistry,
    };

    if (this.options.useGitVersion && !this.options.exact) {
      throw new Error(dedent`
        Using git version without 'exact' option is not recommended.
        Please make sure you publish with --exact.
      `);
    }

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (!this.repository.isIndependent()) {
      this.globalVersion = this.repository.version;
      this.logger.info("current version", this.globalVersion);
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

    this.packagesToPublish = this.updates.map(update => update.package).filter(pkg => !pkg.private);

    this.packagesToPublishCount = this.packagesToPublish.length;
    try {
      this.batchedPackagesToPublish = this.toposort
        ? PackageUtilities.batchPackages(this.packagesToPublish, {
            // Don't sort based on devDependencies because that would increase the chance of dependency cycles
            // causing less-than-ideal a publishing order.
            graphType: "dependencies",
            rejectCycles: this.options.rejectCycles,
          })
        : [this.packagesToPublish];
    } catch (e) {
      return callback(e);
    }

    if (!this.updates.length) {
      this.logger.info("No updated packages to publish.");
      callback(null, false);
      return;
    }

    this.getVersionsForUpdates((err, { version, versions }) => {
      if (err) {
        callback(err);
        return;
      }

      this.masterVersion = version;
      this.updatesVersions =
        versions ||
        this.updates.reduce((obj, update) => {
          obj[update.package.name] = version;
          return obj;
        }, {});

      this.confirmVersions(callback);
    });
  }

  execute(callback) {
    if (!this.repository.isIndependent() && !this.options.canary) {
      this.updateVersionInLernaJson();
    }

    this.updateUpdatedPackages();

    if (this.gitEnabled) {
      this.commitAndTagUpdates();
    }

    if (this.options.skipNpm) {
      callback(null, true);
    } else {
      this.publishPackagesToNpm(callback);
    }
  }

  publishPackagesToNpm(callback) {
    this.logger.info("publish", "Publishing packages to npm...");

    this.npmPublish(publishError => {
      if (publishError) {
        callback(publishError);
        return;
      }

      if (this.options.canary) {
        this.logger.info("canary", "Resetting git state");
        // reset since the package.json files are changed
        this.repository.packageConfigs.forEach(pkgGlob => {
          GitUtilities.checkoutChanges(`${pkgGlob}/package.json`, this.execOpts);
        });
      }

      this.npmUpdateAsLatest(updateError => {
        if (updateError) {
          callback(updateError);
          return;
        }

        if (this.gitEnabled) {
          this.logger.info("git", "Pushing tags...");
          GitUtilities.pushWithTags(this.gitRemote, this.tags, this.execOpts);
        }

        const message = this.packagesToPublish.map(pkg => ` - ${pkg.name}@${pkg.version}`);

        output("Successfully published:");
        output(message.join(os.EOL));

        this.logger.success("publish", "finished");
        callback(null, true);
      });
    });
  }

  getVersionsForUpdates(callback) {
    const { canary, cdVersion, conventionalCommits, preid, repoVersion } = this.options;
    const independentVersions = this.repository.isIndependent();

    if (cdVersion && !canary) {
      if (independentVersions) {
        // Independent Semver Keyword Mode
        const versions = this.updates.reduce((obj, update) => {
          const { name, version } = update.package;
          obj[name] = semver.inc(version, cdVersion, preid);
          return obj;
        }, {});

        return callback(null, { versions });
      }

      // Non-Independent Semver Keyword Mode
      const version = semver.inc(this.globalVersion, cdVersion, preid);
      return callback(null, { version });
    }

    if (repoVersion) {
      return callback(null, {
        version: repoVersion,
      });
    }

    if (canary) {
      if (independentVersions) {
        // Independent Canary Mode
        const versions = this.updates.reduce((obj, update) => {
          const { name, version } = update.package;
          obj[name] = this.getCanaryVersion(version, canary);
          return obj;
        }, {});

        return callback(null, { versions });
      }

      // Non-Independent Canary Mode
      const version = this.getCanaryVersion(this.globalVersion, canary);
      return callback(null, { version });
    }

    if (conventionalCommits) {
      if (independentVersions) {
        // Independent Conventional-Commits Mode
        const versions = this.recommendVersions("independent");

        return callback(null, { versions });
      }

      // Non-Independent Conventional-Commits Mode
      const currentFixedVersion = this.repository.lernaJson.version;

      this.updates.forEach(update => {
        const pkg = update.package;
        if (semver.lt(pkg.version, currentFixedVersion)) {
          this.logger.verbose(
            "publish",
            `Overriding version of ${pkg.name} from  ${pkg.version} to ${currentFixedVersion}`
          );
          pkg.version = currentFixedVersion;
        }
      });

      let version = "0.0.0";
      const bumps = this.recommendVersions("fixed");

      Object.keys(bumps).forEach(name => {
        if (semver.gt(bumps[name], version)) {
          version = bumps[name];
        }
      });

      return callback(null, { version });
    }

    if (independentVersions) {
      // Independent Non-Canary Mode
      async.mapLimit(
        this.updates,
        1,
        (update, cb) => {
          this.promptVersion(update.package.name, update.package.version, cb);
        },
        (err, result) => {
          if (err) {
            return callback(err);
          }

          const versions = this.updates.reduce((obj, update, index) => {
            obj[update.package.name] = result[index];
            return obj;
          }, {});

          return callback(null, { versions });
        }
      );
    } else {
      // Non-Independent Non-Canary Mode
      this.promptVersion(null, this.globalVersion, (err, version) => {
        if (err) {
          return callback(err);
        }
        return callback(null, { version });
      });
    }
  }

  recommendVersions(type) {
    return this.updates.reduce((obj, update) => {
      const pkg = update.package;
      const version = ConventionalCommitUtilities.recommendVersion(pkg, type, this.changelogOpts);

      obj[pkg.name] = version;
      return obj;
    }, {});
  }

  getCanaryVersion(version, _preid) {
    // FIXME: this complicated defaulting should be done in yargs option.coerce()
    const preid = _preid == null || typeof _preid !== "string" ? "alpha" : _preid;

    const release = this.options.cdVersion || "minor";
    const nextVersion = semver.inc(version, release);
    const hash = GitUtilities.getCurrentSHA(this.execOpts).slice(0, 8);
    return `${nextVersion}-${preid}.${hash}`;
  }

  promptVersion(packageName, currentVersion, callback) {
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");
    const prepatch = semver.inc(currentVersion, "prepatch");
    const preminor = semver.inc(currentVersion, "preminor");
    const premajor = semver.inc(currentVersion, "premajor");

    let message = "Select a new version";
    if (packageName) {
      message += ` for ${packageName}`;
    }
    message += ` (currently ${currentVersion})`;

    PromptUtilities.select(
      message,
      {
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
      },
      choice => {
        switch (choice) {
          case "CUSTOM": {
            PromptUtilities.input(
              "Enter a custom version",
              {
                filter: semver.valid,
                validate: v => v !== null || "Must be a valid semver version",
              },
              input => {
                callback(null, input);
              }
            );
            break;
          }

          case "PRERELEASE": {
            const [existingId] = semver.prerelease(currentVersion) || [];
            const defaultVersion = semver.inc(currentVersion, "prerelease", existingId);
            const prompt = `(default: ${
              existingId ? `"${existingId}"` : "none"
            }, yielding ${defaultVersion})`;

            // TODO: allow specifying prerelease identifier as CLI option to skip the prompt
            PromptUtilities.input(
              `Enter a prerelease identifier ${prompt}`,
              {
                filter: v => {
                  const preid = v || existingId;
                  return semver.inc(currentVersion, "prerelease", preid);
                },
              },
              input => {
                callback(null, input);
              }
            );
            break;
          }

          default: {
            callback(null, choice);
            break;
          }
        }
      }
    );
  }

  confirmVersions(callback) {
    const changes = this.updates.map(({ package: pkg }) => {
      let line = ` - ${pkg.name}: ${pkg.version} => ${this.updatesVersions[pkg.name]}`;
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
      callback(null, true);
    } else {
      PromptUtilities.confirm("Are you sure you want to publish the above changes?", confirm => {
        callback(null, confirm);
      });
    }
  }

  updateVersionInLernaJson() {
    this.repository.lernaJson.version = this.masterVersion;
    writeJsonFile.sync(this.repository.lernaJsonLocation, this.repository.lernaJson, { indent: 2 });

    if (!this.options.skipGit) {
      GitUtilities.addFile(this.repository.lernaJsonLocation, this.execOpts);
    }
  }

  runSyncScriptInPackage(pkg, scriptName) {
    pkg.runScriptSync(scriptName, err => {
      if (err) {
        this.logger.error("publish", `error running ${scriptName} in ${pkg.name}\n`, err.stack || err);
      }
    });
  }

  updateUpdatedPackages() {
    const { exact, conventionalCommits } = this.options;
    const independentVersions = this.repository.isIndependent();
    const changedFiles = [];

    // exec preversion lifecycle in root (before all updates)
    this.runSyncScriptInPackage(this.repository.package, "preversion");

    this.updates.forEach(update => {
      const pkg = update.package;

      // set new version
      pkg.version = this.updatesVersions[pkg.name] || pkg.version;

      // update pkg dependencies
      this.updatePackageDepsObject(pkg, "dependencies", exact);
      this.updatePackageDepsObject(pkg, "devDependencies", exact);

      // exec preversion script
      this.runSyncScriptInPackage(pkg, "preversion");

      // write new package
      writePkg.sync(pkg.manifestLocation, pkg.toJSON());
      // NOTE: Object.prototype.toJSON() is normally called when passed to
      // JSON.stringify(), but write-pkg iterates Object.keys() before serializing
      // so it has to be explicit here (otherwise it mangles the instance properties)

      // exec version script
      this.runSyncScriptInPackage(pkg, "version");

      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      if (conventionalCommits) {
        const type = independentVersions ? "independent" : "fixed";
        const changelogLocation = ConventionalCommitUtilities.updateChangelog(pkg, type, this.changelogOpts);

        changedFiles.push(changelogLocation);
      }

      // push to be git committed
      changedFiles.push(pkg.manifestLocation);
    });

    if (conventionalCommits && !independentVersions) {
      const rootPkg = this.repository.packageJson;
      const changelogLocation = ConventionalCommitUtilities.updateChangelog(
        {
          name: rootPkg && rootPkg.name ? rootPkg.name : "root",
          location: this.repository.rootPath,
        },
        "root",
        this.changelogOpts
      );

      changedFiles.push(changelogLocation);
    }

    // exec version lifecycle in root (after all updates)
    this.runSyncScriptInPackage(this.repository.package, "version");

    if (this.gitEnabled) {
      changedFiles.forEach(file => GitUtilities.addFile(file, this.execOpts));
    }
  }

  updatePackageDepsObject(pkg, depsKey, exact) {
    const deps = pkg[depsKey];

    if (!deps) {
      return;
    }

    this.packageGraph.get(pkg.name).localDependencies.forEach((depNode, depName) => {
      const version = this.updatesVersions[depName];

      if (deps[depName] && version) {
        deps[depName] = exact ? version : `^${version}`;
      }
    });
  }

  commitAndTagUpdates() {
    if (this.repository.isIndependent()) {
      this.tags = this.gitCommitAndTagVersionForUpdates();
    } else {
      this.tags = [this.gitCommitAndTagVersion(this.masterVersion)];
    }

    // run the postversion script for each update
    this.updates.forEach(({ package: pkg }) => {
      this.runSyncScriptInPackage(pkg, "postversion");
    });

    // run postversion, if set in the root directory
    this.runSyncScriptInPackage(this.repository.package, "postversion");
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map(({ package: { name } }) => `${name}@${this.updatesVersions[name]}`);
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => `${msg}${os.EOL} - ${tag}`, `${subject}${os.EOL}`);

    GitUtilities.commit(message, this.execOpts);
    tags.forEach(tag => GitUtilities.addTag(tag, this.execOpts));

    return tags;
  }

  gitCommitAndTagVersion(version) {
    const tag = `v${version}`;
    const message = this.options.message
      ? this.options.message.replace(/%s/g, tag).replace(/%v/g, version)
      : tag;

    GitUtilities.commit(message, this.execOpts);
    GitUtilities.addTag(tag, this.execOpts);

    return tag;
  }

  execScript(pkg, script) {
    const scriptLocation = path.join(pkg.location, "scripts", `${script}.js`);

    if (FileSystemUtilities.existsSync(scriptLocation)) {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      require(scriptLocation);
    } else {
      this.logger.verbose("execScript", `No ${script} script found at ${scriptLocation}`);
    }
  }

  npmPublish(callback) {
    const tracker = this.logger.newItem("npmPublish");

    // if we skip temp tags we should tag with the proper value immediately
    // therefore no updates will be needed
    const tag = this.options.tempTag ? "lerna-temp" : this.getDistTag();

    this.updates.forEach(({ package: pkg }) => this.execScript(pkg, "prepublish"));

    tracker.addWork(this.packagesToPublishCount);

    PackageUtilities.runParallelBatches(
      this.batchedPackagesToPublish,
      pkg => {
        let attempts = 0;

        const run = cb => {
          tracker.verbose("publishing", pkg.name);

          NpmUtilities.publishTaggedInDir(tag, pkg, this.npmConfig, err => {
            // FIXME: this err.stack conditional is too cute
            err = (err && err.stack) || err; // eslint-disable-line no-param-reassign

            if (
              !err ||
              // publishing over an existing package which is likely due to a timeout or something
              err.indexOf("You cannot publish over the previously published version") > -1
            ) {
              tracker.info("published", pkg.name);
              tracker.completeWork(1);
              this.execScript(pkg, "postpublish");
              cb();
              return;
            }

            attempts += 1;

            if (attempts < 5) {
              this.logger.error("publish", "Retrying failed publish:", pkg.name);
              this.logger.verbose("publish error", err.message);
              run(cb);
            } else {
              this.logger.error("publish", "Ran out of retries while publishing", pkg.name, err.stack || err);
              cb(err);
            }
          });
        };

        return run;
      },
      this.concurrency,
      err => {
        tracker.finish();
        callback(err);
      }
    );
  }

  npmUpdateAsLatest(callback) {
    if (!this.options.tempTag) {
      return callback();
    }

    const tracker = this.logger.newItem("npmUpdateAsLatest");
    tracker.addWork(this.packagesToPublishCount);

    PackageUtilities.runParallelBatches(
      this.batchedPackagesToPublish,
      pkg => cb => {
        let attempts = 0;

        // eslint-disable-next-line no-constant-condition
        while (true) {
          attempts += 1;

          try {
            this.updateTag(pkg);
            tracker.info("latest", pkg.name);
            tracker.completeWork(1);
            cb();
            break;
          } catch (err) {
            if (attempts < 5) {
              this.logger.error("publish", "Error updating version as latest", err.stack || err);
              continue; // eslint-disable-line no-continue
            } else {
              cb(err);
              return;
            }
          }
        }
      },
      4,
      err => {
        tracker.finish();
        callback(err);
      }
    );
  }

  updateTag(pkg) {
    const distTag = this.getDistTag();

    if (NpmUtilities.checkDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry)) {
      NpmUtilities.removeDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry);
    }

    /* eslint-disable max-len */
    // TODO: fix this API to be less verbose with parameters
    if (this.options.npmTag) {
      NpmUtilities.addDistTag(
        pkg.location,
        pkg.name,
        this.updatesVersions[pkg.name],
        distTag,
        this.npmRegistry
      );
    } else if (this.options.canary) {
      NpmUtilities.addDistTag(pkg.location, pkg.name, pkg.version, distTag, this.npmRegistry);
    } else {
      NpmUtilities.addDistTag(
        pkg.location,
        pkg.name,
        this.updatesVersions[pkg.name],
        distTag,
        this.npmRegistry
      );
    }
    /* eslint-enable max-len */
  }

  getDistTag() {
    return this.options.npmTag || (this.options.canary && "canary") || "latest";
  }
}
