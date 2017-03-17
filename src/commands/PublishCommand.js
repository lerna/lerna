import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import ConventionalCommitUtilities from "../ConventionalCommitUtilities";
import FileSystemUtilities from "../FileSystemUtilities";
import PackageUtilities from "../PackageUtilities";
import PromptUtilities from "../PromptUtilities";
import GitUtilities from "../GitUtilities";
import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import semver from "semver";
import async from "async";
import chalk from "chalk";
import path from "path";
import { EOL } from "os";

export default class PublishCommand extends Command {
  initialize(callback) {

    if (this.flags.canary) {
      this.logger.info("Publishing canary build");
    }

    const currentBranch = GitUtilities.getCurrentBranchDescription();
    if (currentBranch === "") {
      callback("You are working on detached branch, create new branch to publish changes.");
    }

    if (!this.repository.isIndependent()) {
      this.globalVersion = this.repository.version;
      this.logger.info("Current version: " + this.globalVersion);
    }

    const updatedPackagesCollector = new UpdatedPackagesCollector(this);

    try {
      this.updates = updatedPackagesCollector.getUpdates();

      const packagesToPublish = this.updates
        .map((update) => update.package)
        .filter((pkg) => !pkg.isPrivate());

      this.packageToPublishCount = packagesToPublish.length;
      this.batchedPackagesToPublish = this.toposort
        ? PackageUtilities.topologicallyBatchPackages(packagesToPublish, {
          logger: this.logger,
          // Don't sort based on devDependencies because that would increase the chance of dependency cycles
          // causing less-than-ideal a publishing order.
          depsOnly: true,
        })
        : [ packagesToPublish ];

    } catch (err) {
      throw err;
    }

    if (!this.updates.length) {
      callback(new Error("No updated packages to publish."));
      return;
    }

    this.getVersionsForUpdates((err, results) => {
      if (err) {
        callback(err);
        return;
      }

      let {version, versions} = results;

      if (!versions) {
        versions = {};
        this.updates.forEach((update) => {
          versions[update.package.name] = version;
        });
      }

      this.masterVersion = version;
      this.updatesVersions = versions;

      this.confirmVersions((err, confirmed) => {
        if (err) {
          callback(err);
          return;
        }

        if (!confirmed) {
          this.logger.info("Okay bye!");
          callback(null, false);
          return;
        }

        callback(null, true);
      });
    });
  }

  execute(callback) {
    try {
      if (!this.repository.isIndependent() && !this.flags.canary) {
        this.updateVersionInLernaJson();
      }

      this.updateUpdatedPackages();
      if (!this.flags.skipGit) {
        this.commitAndTagUpdates();
      }
    } catch (err) {
      callback(err);
      return;
    }

    if (this.flags.skipNpm) {
      callback(null, true);
    } else {
      this.publishPackagesToNpm(callback);
    }
  }

  publishPackagesToNpm(callback) {

    this.logger.newLine();
    this.logger.info("Publishing packages to npm...");

    this.npmPublishAsPrerelease((err) => {
      if (err) {
        callback(err);
        return;
      }

      if (this.flags.canary) {
        this.logger.info("Resetting git state");
        // reset since the package.json files are changed
        GitUtilities.checkoutChanges("packages/*/package.json");
      }

      this.npmUpdateAsLatest((err) => {
        if (err) {
          callback(err);
          return;
        }

        if (!(this.flags.canary || this.flags.skipGit)) {
          this.logger.info("Pushing tags to git...");
          this.logger.newLine();
          GitUtilities.pushWithTags(this.flags.gitRemote || this.repository.publishConfig.gitRemote || "origin", this.tags);
        }

        let message = "Successfully published:";

        this.updates.forEach((update) => {
          message += `${EOL} - ${update.package.name}@${update.package.version}`;
        });

        this.logger.success(message);
        callback(null, true);
      });
    });
  }

  getVersionsForUpdates(callback) {
    if (this.flags.cdVersion) {
      // Allows automatic bumping to next semver via cdVersion flag
      if (this.flags.cdVersion === "patch" ||
          this.flags.cdVersion === "minor" ||
          this.flags.cdVersion === "major"
      ) {
        // If the version is independent then send versions
        if (this.repository.isIndependent()) {
          const versions = {};
          this.updates.forEach((update) => {
            versions[update.package.name] = semver.inc(update.package.version, this.flags.cdVersion);
          });
          return callback(null, { versions });
        }

        // Otherwise bump the global version
        const version = semver.inc(this.globalVersion, this.flags.cdVersion);
        return callback(null, { version });
      }
    }

    if (this.flags.repoVersion) {
      return callback(null, {
        version: this.flags.repoVersion
      });
    }

    // Non-Independent Canary Mode
    if (!this.repository.isIndependent() && this.flags.canary) {
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
    } else if (this.flags.canary) {
      const versions = {};
      const canaryVersionSuffix = this.getCanaryVersionSuffix();

      this.updates.forEach((update) => {
        versions[update.package.name] = update.package.version + canaryVersionSuffix;
      });

      callback(null, { versions });

    // Independent Conventional-Commits Mode
    } else if (this.flags.conventionalCommits) {
      const versions = {};
      this.updates.map((update) => {
        versions[update.package.name] = ConventionalCommitUtilities.recommendVersion({
          name: update.package.name,
          version: update.package.version,
          location: update.package.location
        });
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
    return "-alpha." + GitUtilities.getCurrentSHA().slice(0, 8);
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
          validate: (v) => semver.valid(v) ? true : "Must be a valid semver version",
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
    this.logger.newLine();
    this.logger.info("Changes:");
    this.logger.info(this.updates.map((update) => {
      const pkg = update.package;
      return `- ${pkg.name}: ${pkg.version} => ${this.updatesVersions[pkg.name]}${pkg.isPrivate() ? ` (${chalk.red("private")})` : ""}`;
    }).join(EOL));
    this.logger.newLine();

    if (!this.flags.yes) {
      PromptUtilities.confirm("Are you sure you want to publish the above changes?", (confirm) => {
        callback(null, confirm);
      });
    } else {
      this.logger.info("Assuming confirmation.");
      callback(null, true);
    }
  }

  updateVersionInLernaJson() {
    this.repository.lernaJson.version = this.masterVersion;
    FileSystemUtilities.writeFileSync(this.repository.lernaJsonLocation, JSON.stringify(this.repository.lernaJson, null, 2));
    if (!this.flags.skipGit) {
      GitUtilities.addFile(this.repository.lernaJsonLocation);
    }
  }

  updateUpdatedPackages() {
    const changedFiles = [];

    this.updates.forEach((update) => {
      const pkg = update.package;
      const packageLocation = pkg.location;
      const packageJsonLocation = path.join(packageLocation, "package.json");

      // set new version
      pkg.version = this.updatesVersions[pkg.name] || pkg.version;

      // update pkg dependencies
      this.updatePackageDepsObject(pkg, "dependencies");
      this.updatePackageDepsObject(pkg, "devDependencies");
      this.updatePackageDepsObject(pkg, "peerDependencies");

      // write new package
      FileSystemUtilities.writeFileSync(packageJsonLocation, pkg.toJsonString());

      // we can now generate the Changelog, based on the
      // the updated version that we're about to release.
      if (this.flags.conventionalCommits) {
        ConventionalCommitUtilities.updateChangelog({
          name: pkg.name,
          location: pkg.location
        });
        changedFiles.push(ConventionalCommitUtilities.changelogLocation(pkg));
      }

      // push to be git committed
      changedFiles.push(packageJsonLocation);
    });

    if (!(this.flags.canary || this.flags.skipGit)) {
      changedFiles.forEach(GitUtilities.addFile);
    }
  }

  updatePackageDepsObject(pkg, depsKey) {
    const deps = pkg[depsKey];
    const {exact} = this.getOptions();

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
    if (!this.flags.canary) {
      if (this.repository.isIndependent()) {
        this.tags = this.gitCommitAndTagVersionForUpdates();
      } else {
        this.tags = [this.gitCommitAndTagVersion(this.masterVersion)];
      }
    }
  }

  gitCommitAndTagVersionForUpdates() {
    const tags = this.updates.map((update) => `${update.package.name}@${this.updatesVersions[update.package.name]}`);
    const message = this.flags.message || tags.reduce((msg, tag) => msg + `${EOL} - ${tag}`, `Publish${EOL}`);

    GitUtilities.commit(message);
    tags.forEach(GitUtilities.addTag);
    return tags;
  }

  gitCommitAndTagVersion(version) {
    const tag = "v" + version;
    const message = this.flags.message || tag;
    GitUtilities.commit(message);
    GitUtilities.addTag(tag);
    return tag;
  }

  execScript(pkg, script) {
    const scriptLocation = path.join(pkg.location, "scripts", script + ".js");

    if (FileSystemUtilities.existsSync(scriptLocation)) {
      require(scriptLocation);
    } else {
      this.logger.verbose(`No ${script} script found at ${scriptLocation}`);
    }
  }

  npmPublishAsPrerelease(callback) {
    const {skipTempTag} = this.getOptions();
    // if we skip temp tags we should tag with the proper value immediately therefore no updates will be needed
    const tag = skipTempTag ? this.getDistTag() : "lerna-temp";

    this.updates.forEach((update) => {
      this.execScript(update.package, "prepublish");
    });

    this.progressBar.init(this.packageToPublishCount);

    PackageUtilities.runParallelBatches(this.batchedPackagesToPublish, (pkg) => {
      let attempts = 0;

      const run = (cb) => {
        this.logger.verbose("Publishing " + pkg.name + "...");

        NpmUtilities.publishTaggedInDir(tag, pkg.location, this.npmRegistry, (err) => {
          err = err && err.stack || err;

          if (!err ||
            // publishing over an existing package which is likely due to a timeout or something
            err.indexOf("You cannot publish over the previously published version") > -1
          ) {
            this.progressBar.tick(pkg.name);
            this.execScript(pkg, "postpublish");
            cb();
            return;
          }

          attempts++;

          if (attempts < 5) {
            this.logger.error("Attempting to retry publishing " + pkg.name + "...", err);
            run(cb);
          } else {
            this.logger.error("Ran out of retries while publishing " + pkg.name, err);
            cb(err);
          }
        });
      };

      return run;
    }, this.concurrency, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  npmUpdateAsLatest(callback) {
    const {skipTempTag} = this.getOptions();

    if (skipTempTag) {
      return callback();
    }

    this.progressBar.init(this.packageToPublishCount);

    PackageUtilities.runParallelBatches(this.batchedPackagesToPublish, (pkg) => (cb) => {
      let attempts = 0;

      while (true) {
        attempts++;

        try {
          this.updateTag(pkg);
          this.progressBar.tick(pkg.name);
          cb();
          break;
        } catch (err) {
          if (attempts < 5) {
            this.logger.error("Error updating version as latest", err);
            continue;
          } else {
            cb(err);
            return;
          }
        }
      }
    }, 4, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  updateTag(pkg) {
    const distTag = this.getDistTag();

    if (NpmUtilities.checkDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry)) {
      NpmUtilities.removeDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry);
    }

    if (this.flags.npmTag) {
      NpmUtilities.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
    } else if (this.flags.canary) {
      NpmUtilities.addDistTag(pkg.location, pkg.name, pkg.version, distTag, this.npmRegistry);
    } else {
      NpmUtilities.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
    }
  }

  getDistTag() {
    const {npmTag, canary} = this.getOptions();
    return npmTag || (canary && "canary") || "latest";
  }
}
