import _ from "lodash";
import minimatch from "minimatch";
import path from "path";

import GitUtilities from "./GitUtilities";

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

export default class UpdatedPackagesCollector {
  constructor(command) {
    this.execOpts = command.execOpts;
    this.logger = command.logger;
    this.repository = command.repository;
    this.packages = command.filteredPackages;
    this.packageGraph = command.repository.packageGraph;
    this.options = command.options;
  }

  getUpdates() {
    this.logger.silly("getUpdates");

    this.updatedPackages = this.collectUpdatedPackages();
    this.dependents = this.collectDependents();
    return this.collectUpdates();
  }

  collectUpdatedPackages() {
    this.logger.info("", "Checking for updated packages...");

    const hasTags = GitUtilities.hasTags(this.execOpts);

    if (hasTags) {
      const tag = GitUtilities.getLastTag(this.execOpts);
      this.logger.info("", "Comparing with tag " + tag);
    } else {
      this.logger.warn("", "No tags found!");
      this.logger.info("", "Comparing with initial commit.");
    }

    let commits;

    if (this.options.canary) {
      let currentSHA;

      if (this.options.canary !== true) {
        currentSHA = this.options.canary;
      } else {
        currentSHA = GitUtilities.getCurrentSHA(this.execOpts);
      }

      commits = this.getAssociatedCommits(currentSHA);
    } else if (hasTags) {
      commits = GitUtilities.describeTag(
        GitUtilities.getLastTaggedCommitInBranch(this.execOpts),
        this.execOpts
      );
    }

    const updatedPackages = {};
    const tracker = this.logger.newItem("find updated packages");
    tracker.addWork(this.packages.length);

    this.packages.filter((pkg) => {
      tracker.completeWork(1);

      if (!hasTags) {
        return true;
      }

      const forcePublish = (this.options.forcePublish || "").split(",");

      if (forcePublish.indexOf("*") > -1) {
        return true;
      } else if (forcePublish.indexOf(pkg.name) > -1) {
        return true;
      } else {
        return this.hasDiffSinceThatIsntIgnored(pkg, commits);
      }
    }).forEach((pkg) => {
      this.logger.verbose("has update", pkg.name);
      updatedPackages[pkg.name] = pkg;
    });

    tracker.finish();

    return updatedPackages;
  }

  isPackageDependentOf(packageName, dependency) {
    this.logger.silly("isPackageDependentOf", packageName, dependency);

    if (!this.cache[packageName]) {
      this.cache[packageName] = {};
    }

    if (this.cache[packageName][dependency] === "dependent") {
      return true;
    } else if (this.cache[packageName][dependency] === "visited") {
      return false;
    }

    const dependencies = this.packageGraph.get(packageName).dependencies;

    if (dependencies.indexOf(dependency) > -1) {
      this.cache[packageName][dependency] = "dependent";
      return true;
    }

    this.cache[packageName][dependency] = "visited";

    let hasSubDependents = false;

    dependencies.forEach((dep) => {
      if (this.isPackageDependentOf(dep, dependency)) {
        this.cache[packageName][dependency] = "dependent";
        hasSubDependents = true;
      }
    });

    return hasSubDependents;
  }

  collectDependents() {
    this.logger.silly("collectDependents");

    const dependents = {};
    this.cache = {};

    this.packages.forEach((pkg) => {
      Object.keys(this.updatedPackages).forEach((dependency) => {
        if (this.isPackageDependentOf(pkg.name, dependency)) {
          this.logger.verbose("dependent", "%s depends on %s", pkg.name, dependency);
          dependents[pkg.name] = pkg;
        }
      });
    });

    return dependents;
  }

  collectUpdates() {
    this.logger.silly("collectUpdates");

    return this.packages.filter((pkg) => {
      return (
        this.updatedPackages[pkg.name] ||
        (this.options[SECRET_FLAG] ? false : this.dependents[pkg.name]) ||
        this.options.canary
      );
    }).map((pkg) => {
      this.logger.verbose("has filtered update", pkg.name);
      return new Update(pkg);
    });
  }

  getAssociatedCommits(sha) {
    // if it's a merge commit, it will return all the commits that were part of the merge
    // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
    return sha.slice(0, 8) + "^.." + sha.slice(0, 8);
  }

  hasDiffSinceThatIsntIgnored(pkg, commits) {
    const folder = path.relative(this.repository.rootPath, pkg.location);
    const diff = GitUtilities.diffSinceIn(commits, pkg.location, this.execOpts);

    if (diff === "") {
      return false;
    }

    let changedFiles = diff.split("\n").map((file) => {
      return file.replace(folder + path.sep, "");
    });

    if (this.options.ignore) {
      changedFiles = changedFiles.filter((file) => {
        return !_.find(this.options.ignore, (pattern) => {
          return minimatch(file, pattern, { matchBase: true });
        });
      });
    }

    return !!changedFiles.length;
  }
}

// TODO: remove this when we _really_ remove support for SECRET_FLAG
const Buffer = require("safe-buffer").Buffer;
// eslint-disable-next-line max-len
const SECRET_FLAG = Buffer.from("ZGFuZ2Vyb3VzbHlPbmx5UHVibGlzaEV4cGxpY2l0VXBkYXRlc1RoaXNJc0FDdXN0b21GbGFnRm9yQmFiZWxBbmRZb3VTaG91bGROb3RCZVVzaW5nSXRKdXN0RGVhbFdpdGhNb3JlUGFja2FnZXNCZWluZ1B1Ymxpc2hlZEl0SXNOb3RBQmlnRGVhbA==", "base64").toString("ascii");
