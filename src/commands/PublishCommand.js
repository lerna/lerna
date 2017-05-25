import { EOL } from "os";
import async from "async";
import chalk from "chalk";
import path from "path";
import semver from "semver";
import writeJsonFile from "write-json-file";
import writePkg from "write-pkg";

import Command from "../Command";
import ConventionalCommitUtilities from "../ConventionalCommitUtilities";
import FileSystemUtilities from "../FileSystemUtilities";
import GitUtilities from "../GitUtilities";
import NpmUtilities from "../NpmUtilities";
import output from "../utils/output";
import PackageUtilities from "../PackageUtilities";
import PromptUtilities from "../PromptUtilities";
import UpdatedPackagesCollector from "../UpdatedPackagesCollector";

export function handler(argv) {
  return new PublishCommand(argv._, argv).run();
}

export const command = "publish";

export const describe = "Publish packages in the current project.";

export const builder = {
  "canary": {
    group: "Command Options:",
    describe: "Publish packages after every successful merge using the sha as part of the tag.",
    alias: "c"
  },
  "cd-version": {
    group: "Command Options:",
    describe: "Skip the version selection prompt and increment semver 'major', 'minor', or 'patch'.",
    type: "string",
    requiresArg: true,
    coerce: (choice) => {
      if (!["major", "minor", "patch"].some((inc) => choice === inc)) {
        throw new Error(`--cd-version must be one of 'major', 'minor', or 'patch', got '${choice}'`);
      }
      return choice;
    },
  },
  "conventional-commits": {
    group: "Command Options:",
    describe: "Use angular conventional-commit format to determine version bump and generate CHANGELOG."
  },
  "exact": {
    group: "Command Options:",
    describe: "Specify cross-dependency version numbers exactly rather than with a caret (^)."
  },
  "git-remote": {
    group: "Command Options:",
    defaultDescription: "origin",
    describe: "Push git changes to the specified remote instead of 'origin'.",
    type: "string",
    requiresArg: true
  },
  "yes": {
    group: "Command Options:",
    describe: "Skip all confirmation prompts."
  },
  "message": {
    group: "Command Options:",
    describe: "Use a custom commit message when creating the publish commit.",
    alias: "m",
    type: "string",
    requiresArg: true
  },
  "npm-tag": {
    group: "Command Options:",
    describe: "Publish packages with the specified npm dist-tag",
    type: "string",
    requiresArg: true
  },
  "repo-version": {
    group: "Command Options:",
    describe: "Specify repo version to publish.",
    type: "string",
    requiresArg: true
  },
  "skip-git": {
    group: "Command Options:",
    describe: "Skip commiting, tagging, and pushing git changes."
  },
  "skip-npm": {
    group: "Command Options:",
    describe: "Stop before actually publishing change to npm."
  },
  "temp-tag": {
    group: "Command Options:",
    describe: "Create a temporary tag while publishing."
  }
};

export default class PublishCommand extends Command {
  initialize(callback) {
    this.gitRemote = this.options.gitRemote || "origin";
    this.gitEnabled = !(this.options.canary || this.options.skipGit);

    if (this.options.canary) {
      this.logger.info("canary", "enabled");
    }

    if (!this.repository.isIndependent()) {
      this.globalVersion = this.repository.version;
      this.logger.info("current version", this.globalVersion);
    }

    this.updates = new UpdatedPackagesCollector(this).getUpdates();

    const packagesToPublish = this.updates
      .map((update) => update.package)
      .filter((pkg) => !pkg.isPrivate());

    this.packageToPublishCount = packagesToPublish.length;
    this.batchedPackagesToPublish = this.toposort
      ? PackageUtilities.topologicallyBatchPackages(packagesToPublish, {
        // Don't sort based on devDependencies because that would increase the chance of dependency cycles
        // causing less-than-ideal a publishing order.
        depsOnly: true,
      })
      : [packagesToPublish];

    if (!this.updates.length) {
      this.logger.info("No updated packages to publish.");
      callback(null, true);
      return;
    }

    this.getVersionsForUpdates((err, results) => {
      if (err) {
        callback(err);
        return;
      }

      const version = results.version;
      let versions = results.versions;

      if (!versions) {
        versions = {};
        this.updates.forEach((update) => {
          versions[update.package.name] = version;
        });
      }

      this.masterVersion = version;
      this.updatesVersions = versions;

      this.confirmVersions(callback);
    });
  }

  execute(callback) {
    try {
      if (this.gitEnabled && GitUtilities.isDetachedHead(this.execOpts)) {
        throw new Error("Detached git HEAD, please checkout a branch to publish changes.");
      }

      if (!this.repository.isIndependent() && !this.options.canary) {
        this.updateVersionInLernaJson();
      }

      this.updateUpdatedPackages();

      if (this.gitEnabled) {
        this.commitAndTagUpdates();
      }
    } catch (err) {
      callback(err);
      return;
    }

    if (this.options.skipNpm) {
      callback(null, true);
    } else {
      this.publishPackagesToNpm(callback);
    }
  }

  publishPackagesToNpm(callback) {
    this.logger.info("publish", "Publishing packages to npm...");

    this.npmPublishAsPrerelease((err) => {
      if (err) {
        callback(err);
        return;
      }

      if (this.options.canary) {
        this.logger.info("canary", "Resetting git state");
        // reset since the package.json files are changed
        GitUtilities.checkoutChanges("packages/*/package.json", this.execOpts);
      }

      this.npmUpdateAsLatest((err) => {
        if (err) {
          callback(err);
          return;
        }

        if (this.gitEnabled) {
          this.logger.info("git", "Pushing tags...");
          GitUtilities.pushWithTags(this.gitRemote, this.tags, this.execOpts);
        }

        const message = this.updates.map((update) =>
          ` - ${update.package.name}@${update.package.version}`
        );

        output("Successfully published:");
        output(message.join(EOL));

        this.logger.success("publish", "finished");
        callback(null, true);
      });
    });
  }

  getVersionsForUpdates(callback) {
    if (this.options.cdVersion) {
      // If the version is independent then send versions
      if (this.repository.isIndependent()) {
        const versions = {};

        this.updates.forEach((update) => {
          versions[update.package.name] = semver.inc(update.package.version, this.options.cdVersion);
        });

        return callback(null, { versions });
      }

      // Otherwise bump the global version
      const version = semver.inc(this.globalVersion, this.options.cdVersion);
      return callback(null, { version });
    }

    if (this.options.repoVersion) {
      return callback(null, {
        version: this.options.repoVersion
      });
    }

    // Non-Independent Canary Mode
    if (!this.repository.isIndependent() && this.options.canary) {
      const version = this.globalVersion + this.getCanaryVersionSuffix();
      callback(null, { version });

    // Non-Independent Non-Canary Mode
    } else if (!this.repository.isIndependent()) {
      this.promptVersion(null, this.globalVersion, (err, version) => {
        if (err) {
          callback(err);
        } else {
          callback(null, { version });
        }
      });

    // Independent Canary Mode
    } else if (this.options.canary) {
      const versions = {};
      const canaryVersionSuffix = this.getCanaryVersionSuffix();

      this.updates.forEach((update) => {
        versions[update.package.name] = update.package.version + canaryVersionSuffix;
      });

      callback(null, { versions });

    // Independent Conventional-Commits Mode
    } else if (this.options.conventionalCommits) {
      const versions = {};
      this.updates.map((update) => {
        versions[update.package.name] = ConventionalCommitUtilities.recommendVersion({
          name: update.package.name,
          version: update.package.version,
          location: update.package.location
        }, this.execOpts);
      });
      callback(null, { versions });

    // Independent Non-Canary Mode
    } else {
      async.mapLimit(this.updates, 1, (update, cb) => {
        this.promptVersion(update.package.name, update.package.version, cb);
      }, (err, versions) => {
        if (err) {
          return callback(err);
        }

        this.updates.forEach((update, index) => {
          versions[update.package.name] = versions[index];
        });

        callback(null, { versions });
      });
    }
  }

  getCanaryVersionSuffix() {
    return "-alpha." + GitUtilities.getCurrentSHA(this.execOpts).slice(0, 8);
  }

  promptVersion(packageName, currentVersion, callback) {
    const patch = semver.inc(currentVersion, "patch");
    const minor = semver.inc(currentVersion, "minor");
    const major = semver.inc(currentVersion, "major");
    const prepatch = semver.inc(currentVersion, "prepatch");
    const preminor = semver.inc(currentVersion, "preminor");
    const premajor = semver.inc(currentVersion, "premajor");


    let message = "Select a new version";
    if (packageName) message += ` for ${packageName}`;
    message += ` (currently ${currentVersion})`;

    PromptUtilities.select(message, {
      choices: [
        { value: patch, name: `Patch (${patch})` },
        { value: minor, name: `Minor (${minor})` },
        { value: major, name: `Major (${major})` },
        { value: prepatch, name: `Prepatch (${prepatch})` },
        { value: preminor, name: `Preminor (${preminor})` },
        { value: premajor, name: `Premajor (${premajor})` },
        { value: "PRERELEASE", name: "Prerelease" },
        { value: "CUSTOM", name: "Custom" }
      ]
    }, (choice) => {
      switch (choice) {

        case "CUSTOM": {
          PromptUtilities.input("Enter a custom version", {
            filter: semver.valid,
            validate: (v) => v !== null || "Must be a valid semver version",
          }, (input) => {
            callback(null, input);
          });
          break;
        }

        case "PRERELEASE": {
          const components = semver.prerelease(currentVersion);
          let existingId = null;
          if (components && components.length === 2) {
            existingId = components[0];
          }
          const defaultVersion = semver.inc(currentVersion, "prerelease", existingId);
          const prompt = `(default: ${existingId ? `"${existingId}"` : "none"}, yielding ${defaultVersion})`;

          PromptUtilities.input(`Enter a prerelease identifier ${prompt}`, {
            filter: (v) => {
              const prereleaseId = v ? v : existingId;
              return semver.inc(currentVersion, "prerelease", prereleaseId);
            },
          }, (input) => {
            callback(null, input);
          });
          break;
        }

        default: {
          callback(null, choice);
          break;
        }

      }
    });
  }

  confirmVersions(callback) {
    const changes = this.updates.map((update) => {
      const pkg = update.package;
      let line = ` - ${pkg.name}: ${pkg.version} => ${this.updatesVersions[pkg.name]}`;
      if (pkg.isPrivate()) {
        line += ` (${chalk.red("private")})`;
      }
      return line;
    });

    output("");
    output("Changes:");
    output(changes.join(EOL));
    output("");

    if (this.options.yes) {
      this.logger.info("auto-confirmed");
      callback(null, true);
    } else {
      PromptUtilities.confirm("Are you sure you want to publish the above changes?", (confirm) => {
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

  updateUpdatedPackages() {
    const { exact } = this.options;
    const changedFiles = [];

    this.updates.forEach((update) => {
      const pkg = update.package;
      const packageLocation = pkg.location;
      const packageJsonLocation = path.join(packageLocation, "package.json");

      // set new version
      pkg.version = this.updatesVersions[pkg.name] || pkg.version;

      // update pkg dependencies
      this.updatePackageDepsObject(pkg, "dependencies", exact);
      this.updatePackageDepsObject(pkg, "devDependencies", exact);
      this.updatePackageDepsObject(pkg, "peerDependencies", exact);

      // write new package
      writePkg.sync(packageJsonLocation, pkg.toJSON());
      // NOTE: Object.prototype.toJSON() is normally called when passed to
      // JSON.stringify(), but write-pkg iterates Object.keys() before serializing
      // so it has to be explicit here (otherwise it mangles the instance properties)

      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      if (this.options.conventionalCommits) {
        ConventionalCommitUtilities.updateChangelog({
          name: pkg.name,
          location: pkg.location
        }, this.execOpts);
        changedFiles.push(ConventionalCommitUtilities.changelogLocation(pkg));
      }

      // push to be git committed
      changedFiles.push(packageJsonLocation);
    });

    if (this.gitEnabled) {
      changedFiles.forEach((file) => GitUtilities.addFile(file, this.execOpts));
    }
  }

  updatePackageDepsObject(pkg, depsKey, exact) {
    const deps = pkg[depsKey];

    if (!deps) {
      return;
    }

    this.packageGraph.get(pkg.name).dependencies.forEach((depName) => {
      const version = this.updatesVersions[depName];

      if (deps[depName] && version) {
        deps[depName] = exact ? version : ("^" + version);
      }
    });
  }

  commitAndTagUpdates() {
    if (this.repository.isIndependent()) {
      this.tags = this.gitCommitAndTagVersionForUpdates();
    } else {
      this.tags = [this.gitCommitAndTagVersion(this.masterVersion)];
    }
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map(({ package: { name } }) =>
      `${name}@${this.updatesVersions[name]}`
    );
    const subject = this.options.message || "Publish";
    const message = tags.reduce((msg, tag) => msg + `${EOL} - ${tag}`, `${subject}${EOL}`);

    GitUtilities.commit(message, this.execOpts);
    tags.forEach((tag) => GitUtilities.addTag(tag, this.execOpts));

    return tags;
  }

  gitCommitAndTagVersion(version) {
    const tag = "v" + version;
    const message = this.options.message && this.options.message.replace(/%s/g, tag) || tag;

    GitUtilities.commit(message, this.execOpts);
    GitUtilities.addTag(tag, this.execOpts);

    return tag;
  }

  execScript(pkg, script) {
    const scriptLocation = path.join(pkg.location, "scripts", script + ".js");

    if (FileSystemUtilities.existsSync(scriptLocation)) {
      require(scriptLocation);
    } else {
      this.logger.verbose("execScript", `No ${script} script found at ${scriptLocation}`);
    }
  }

  npmPublishAsPrerelease(callback) {
    const tracker = this.logger.newItem("npmPublishAsPrerelease");

    // if we skip temp tags we should tag with the proper value immediately
    // therefore no updates will be needed
    const tag = this.options.tempTag ? "lerna-temp" : this.getDistTag();

    this.updates.forEach((update) => {
      this.execScript(update.package, "prepublish");
    });

    tracker.addWork(this.packageToPublishCount);

    PackageUtilities.runParallelBatches(this.batchedPackagesToPublish, (pkg) => {
      let attempts = 0;

      const run = (cb) => {
        tracker.verbose("publishing", pkg.name);

        NpmUtilities.publishTaggedInDir(tag, pkg.location, this.npmRegistry, (err) => {
          err = err && err.stack || err;

          if (!err ||
            // publishing over an existing package which is likely due to a timeout or something
            err.indexOf("You cannot publish over the previously published version") > -1
          ) {
            tracker.info("published", pkg.name);
            tracker.completeWork(1);
            this.execScript(pkg, "postpublish");
            cb();
            return;
          }

          attempts++;

          if (attempts < 5) {
            this.logger.error("publish", "Retrying failed publish:", pkg.name);
            this.logger.verbose("publish error", err);
            run(cb);
          } else {
            this.logger.error("publish", "Ran out of retries while publishing", pkg.name, err);
            cb(err);
          }
        });
      };

      return run;
    }, this.concurrency, (err) => {
      tracker.finish();
      callback(err);
    });
  }

  npmUpdateAsLatest(callback) {
    if (!this.options.tempTag) {
      return callback();
    }

    const tracker = this.logger.newItem("npmUpdateAsLatest");
    tracker.addWork(this.packageToPublishCount);

    PackageUtilities.runParallelBatches(this.batchedPackagesToPublish, (pkg) => (cb) => {
      let attempts = 0;

      while (true) {
        attempts++;

        try {
          this.updateTag(pkg);
          tracker.info("latest", pkg.name);
          tracker.completeWork(1);
          cb();
          break;
        } catch (err) {
          if (attempts < 5) {
            this.logger.error("publish", "Error updating version as latest", err);
            continue;
          } else {
            cb(err);
            return;
          }
        }
      }
    }, 4, (err) => {
      tracker.finish();
      callback(err);
    });
  }

  updateTag(pkg) {
    const distTag = this.getDistTag();

    if (NpmUtilities.checkDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry)) {
      NpmUtilities.removeDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry);
    }

    /* eslint-disable max-len */
    // TODO: fix this API to be less verbose with parameters
    if (this.options.npmTag) {
      NpmUtilities.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
    } else if (this.options.canary) {
      NpmUtilities.addDistTag(pkg.location, pkg.name, pkg.version, distTag, this.npmRegistry);
    } else {
      NpmUtilities.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
    }
    /* eslint-enable max-len */
  }

  getDistTag() {
    return this.options.npmTag || (this.options.canary && "canary") || "latest";
  }
}
