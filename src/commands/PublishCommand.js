import UpdatedPackagesCollector from "../UpdatedPackagesCollector";
import FileSystemUtilities from "../FileSystemUtilities";
import PromptUtilities from "../PromptUtilities";
import GitUtilities from "../GitUtilities";
import NpmUtilities from "../NpmUtilities";
import Command from "../Command";
import semver from "semver";
import async from "async";
import path from "path";
import { EOL } from "os";

export default class PublishCommand extends Command {
  initialize(callback) {
    if (this.flags.canary) {
      this.logger.info("Publishing canary build");
    }

    if (!this.repository.isIndependent()) {
      this.globalVersion = this.repository.version;
      this.logger.info("Current version: " + this.globalVersion);
    }

    const updatedPackagesCollector = new UpdatedPackagesCollector(
      this.packages,
      this.packageGraph,
      this.flags,
      this.repository.publishConfig
    );

    try {
      this.updates = updatedPackagesCollector.getUpdates();
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
          GitUtilities.pushWithTags(this.tags);
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

    let message = "Select a new version";
    if (packageName) message += ` for ${packageName}`;
    message += ` (currently ${currentVersion})`;

    PromptUtilities.select(message, {
      choices: [
        { value: patch, name: `Patch (${patch})` },
        { value: minor, name: `Minor (${minor})` },
        { value: major, name: `Major (${major})` },
        { value: false, name: "Custom" }
      ]
    }, (choice) => {
      if (choice) {
        callback(null, choice);
        return;
      }

      PromptUtilities.input("Enter a custom version", {
        filter: semver.valid,
        validate: (v) => semver.valid(v) ? true : "Must be a valid semver version",
      }, (input) => {
        callback(null, input);
      });
    });
  }

  confirmVersions(callback) {
    this.logger.newLine();
    this.logger.info("Changes:");
    this.logger.info(this.updates.map((update) => {
      return `- ${update.package.name}: ${update.package.version} => ${this.updatesVersions[update.package.name]}`;
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
    FileSystemUtilities.writeFileSync(this.repository.lernaJsonLocation, JSON.stringify(this.repository.lernaJson, null, "  "));
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

      // push to be git committed
      changedFiles.push(packageJsonLocation);
    });

    if (!(this.flags.canary || this.flags.skipGit)) {
      changedFiles.forEach(GitUtilities.addFile);
    }
  }

  updatePackageDepsObject(pkg, depsKey) {
    const deps = pkg[depsKey];

    if (!deps) {
      return;
    }

    this.packageGraph.get(pkg.name).dependencies.forEach((depName) => {
      const version = this.updatesVersions[depName];

      if (deps[depName] && version) {
        deps[depName] = "^" + version;
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
    let message = "Publish" + EOL;

    const tags = this.updates.map((update) => {
      const tag = `${update.package.name}@${this.updatesVersions[update.package.name]}`;
      message += `${EOL} - ${tag}`;
      return tag;
    });

    GitUtilities.commit(message);
    tags.forEach(GitUtilities.addTag);
    return tags;
  }

  gitCommitAndTagVersion(version) {
    const tag = "v" + version;
    GitUtilities.commit(tag);
    GitUtilities.addTag(tag);
    return tag;
  }

  execScript(pkg, script) {
    const scriptLocation = path.join(pkg.location, "scripts", script + ".js");

    if (FileSystemUtilities.existsSync(scriptLocation)) {
      require(scriptLocation);
    } else {
      this.logger.debug(`No ${script} script found at ${scriptLocation}`);
    }
  }

  npmPublishAsPrerelease(callback) {
    this.updates.forEach((update) => {
      this.execScript(update.package, "prepublish");
    });

    this.progressBar.init(this.updates.length);

    async.parallelLimit(this.updates.map((update) => {
      const pkg = update.package;

      let attempts = 0;

      const run = (cb) => {
        this.logger.debug("Publishing " + pkg.name + "...");

        NpmUtilities.publishTaggedInDir("lerna-temp", pkg.location, (err) => {
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
    }), this.concurrency, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }

  npmUpdateAsLatest(callback) {
    this.progressBar.init(this.updates.length);

    async.parallelLimit(this.updates.map((update) => (cb) => {
      const pkg = update.package;

      let attempts = 0;

      while (true) {
        attempts++;

        try {
          if (NpmUtilities.checkDistTag(pkg.name, "lerna-temp")) {
            NpmUtilities.removeDistTag(pkg.name, "lerna-temp");
          }

          if (this.flags.npmTag) {
            NpmUtilities.addDistTag(pkg.name, this.updatesVersions[pkg.name], this.flags.npmTag);
          } else if (this.flags.canary) {
            NpmUtilities.addDistTag(pkg.name, pkg.version, "canary");
          } else {
            NpmUtilities.addDistTag(pkg.name, this.updatesVersions[pkg.name], "latest");
          }

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
    }), 4, (err) => {
      this.progressBar.terminate();
      callback(err);
    });
  }
}
