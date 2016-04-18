import GitUtilities from "./GitUtilities";
import progressBar from "./progressBar";
import logger from "./logger";
import find from "lodash.find";

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

export default class UpdatedPackagesCollector {
  constructor(packages, packageGraph, forceVersion, flags) {
    this.packages = packages;
    this.packageGraph = packageGraph;
    this.forceVersion = (forceVersion || "").split(",");
    this.flags = flags;
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

    this.packages.filter(pkg => {
      progressBar.tick(pkg.name);

      if (pkg.isPrivate()) {
        return false;
      }

      if (!hasTags) {
        return true;
      }

      if (this.forceVersion.indexOf("*") > -1) {
        return true;
      } else if (this.forceVersion.indexOf(pkg.name) > -1) {
        return true;
      } else {
        return !!GitUtilities.diffSinceIn(commits, pkg.location);
      }
    }).forEach(pkg => {
      updatedPackages[pkg.name] = pkg;
    });

    progressBar.terminate();

    return updatedPackages;
  }

  isPackageDependentOf(packageName, dependency) {
    var dependencies = this.packageGraph.get(packageName).dependencies;

    if (dependencies.indexOf(dependency) > -1) {
      return true;
    }

    return !!find(dependencies, dep => {
      return this.isPackageDependentOf(dep, dependency);
    });
  }

  collectDependents() {
    const dependents = {};

    this.packages.forEach(pkg => {
      Object.keys(this.updatedPackages).forEach(dependency => {
        if (this.isPackageDependentOf(pkg.name, dependency)) {
          dependents[pkg.name] = pkg;
        }
      });
    });

    return dependents;
  }

  collectUpdates() {
    return this.packages.filter(pkg => {
      return this.updatedPackages[pkg.name] || this.dependents[pkg.name] || this.flags.canary;
    }).map(pkg => {
      return new Update(pkg);
    });
  }

  getAssociatedCommits(sha) {
    // if it's a merge commit, it will return all the commits that were part of the merge
    // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
    return sha.slice(0, 8) + "^.." + sha.slice(0, 8);
  }
}
