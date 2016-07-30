import PackageUtilities from "./PackageUtilities";
import GitUtilities from "./GitUtilities";
import progressBar from "./progressBar";
import minimatch from "minimatch";
import logger from "./logger";
import find from "lodash.find";
import path from "path";

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

export default class UpdatedPackagesCollector {
  constructor(packages, packageGraph, flags, publishConfig) {
    this.packages = packages;
    this.packageGraph = packageGraph;
    this.flags = flags;
    this.publishConfig = publishConfig;
  }

  getUpdates() {
    this.updatedPackages = this.collectUpdatedPackages();
    this.dependents = this.collectDependents();
    return this.collectUpdates();
  }

  collectUpdatedPackages() {
    logger.info("Checking for updated packages...");
    progressBar.init(this.packages.length);

    const hasTags = GitUtilities.hasTags();
    let commits;

    if (this.flags.canary) {
      let currentSHA;

      if (this.flags.canary !== true) {
        currentSHA = this.flags.canary;
      } else {
        currentSHA = GitUtilities.getCurrentSHA();
      }

      commits = this.getAssociatedCommits(currentSHA);
    } else if (hasTags) {
      commits = GitUtilities.describeTag(GitUtilities.getLastTaggedCommit());
    }

    const updatedPackages = {};

    this.packages.filter((pkg) => {
      progressBar.tick(pkg.name);

      if (pkg.isPrivate()) {
        return false;
      }

      if (!hasTags) {
        return true;
      }

      const forcePublish = (this.flags.forcePublish || "").split(",");

      if (forcePublish.indexOf("*") > -1) {
        return true;
      } else if (forcePublish.indexOf(pkg.name) > -1) {
        return true;
      } else {
        return this.hasDiffSinceThatIsntIgnored(pkg, commits);
      }
    }).forEach((pkg) => {
      updatedPackages[pkg.name] = pkg;
    });

    progressBar.terminate();

    return updatedPackages;
  }

  isPackageDependentOf(packageName, dependency) {
    if (!this.cache[packageName]) {
      this.cache[packageName] = {};
    }

    if (this.cache[packageName][dependency] === "dependent") {
      return true;
    } else if (this.cache[packageName][dependency] === "visited") {
      return false;
    }

    let dependencies = this.packageGraph.get(packageName).dependencies;

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
    const dependents = {};
    this.cache = {};

    this.packages.forEach((pkg) => {
      Object.keys(this.updatedPackages).forEach((dependency) => {
        if (this.isPackageDependentOf(pkg.name, dependency)) {
          dependents[pkg.name] = pkg;
        }
      });
    });

    return dependents;
  }

  collectUpdates() {
    return this.packages.filter((pkg) => {
      return this.updatedPackages[pkg.name] || (this.flags.onlyExplicitUpdates ? false : this.dependents[pkg.name]) || this.flags.canary;
    }).map((pkg) => {
      return new Update(pkg);
    });
  }

  getAssociatedCommits(sha) {
    // if it's a merge commit, it will return all the commits that were part of the merge
    // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
    return sha.slice(0, 8) + "^.." + sha.slice(0, 8);
  }

  hasDiffSinceThatIsntIgnored(pkg, commits) {
    const folder = PackageUtilities.getPackagePath(PackageUtilities.getPackagesPath(""), pkg.name);
    const diff = GitUtilities.diffSinceIn(commits, pkg.location);

    if (diff === "") {
      return false;
    }

    let changedFiles = diff.split("\n").map((file) => {
      return file.replace(folder + path.sep, "");
    });

    if (this.publishConfig.ignore) {
      changedFiles = changedFiles.filter((file) => {
        return !find(this.publishConfig.ignore, (pattern) => {
          return minimatch(file, pattern, {matchBase: true});
        });
      });
    }

    return !!changedFiles.length;
  }
}
