import _ from "lodash";
import minimatch from "minimatch";
import path from "path";
import semver from "semver";

import GitUtilities from "./GitUtilities";

// TODO: remove this when we _really_ remove support for SECRET_FLAG
const Buffer = require("safe-buffer").Buffer; // eslint-disable-line prefer-destructuring

const SECRET_FLAG = Buffer.from(
  // eslint-disable-next-line max-len
  "ZGFuZ2Vyb3VzbHlPbmx5UHVibGlzaEV4cGxpY2l0VXBkYXRlc1RoaXNJc0FDdXN0b21GbGFnRm9yQmFiZWxBbmRZb3VTaG91bGROb3RCZVVzaW5nSXRKdXN0RGVhbFdpdGhNb3JlUGFja2FnZXNCZWluZ1B1Ymxpc2hlZEl0SXNOb3RBQmlnRGVhbA==",
  "base64"
).toString("ascii");

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

function getForcedPackages({ forcePublish }) {
  // new Set(null) is equivalent to new Set([])
  // i.e., an empty Set
  let inputs = null;

  if (forcePublish === true) {
    // --force-publish
    inputs = ["*"];
  } else if (typeof forcePublish === "string") {
    // --force-publish=*
    // --force-publish=foo
    // --force-publish=foo,bar
    inputs = forcePublish.split(",");
  } else if (Array.isArray(forcePublish)) {
    // --force-publish foo --force-publish baz
    inputs = [...forcePublish];
  }

  return new Set(inputs);
}

export default class UpdatedPackagesCollector {
  constructor(command) {
    this.execOpts = command.execOpts;
    this.logger = command.logger;
    this.repository = command.repository;
    this.packages = command.filteredPackages;
    this.packageGraph = command.packageGraph;
    this.options = command.options;
  }

  getUpdates() {
    this.logger.silly("getUpdates");

    this.updatedPackages = this.collectUpdatedPackages();
    this.prereleasedPackages = this.collectPrereleasedPackages();
    this.dependents = this.collectDependents();
    return this.collectUpdates();
  }

  collectUpdatedPackages() {
    this.logger.info("", "Checking for updated packages...");

    const { execOpts, options } = this;
    const { canary } = options;
    let { since } = options;

    if (GitUtilities.hasTags(execOpts)) {
      if (canary) {
        const currentSHA = GitUtilities.getCurrentSHA(execOpts);

        since = this.getAssociatedCommits(currentSHA);
      } else if (!since) {
        since = GitUtilities.getLastTag(execOpts);
      }
    }

    this.logger.info("", `Comparing with ${since || "initial commit"}.`);

    const updatedPackages = {};

    const registerUpdated = pkg => {
      this.logger.verbose("updated", pkg.name);
      updatedPackages[pkg.name] = pkg;
    };

    const forced = getForcedPackages(options);

    if (!since || forced.has("*")) {
      this.packages.forEach(registerUpdated);
    } else {
      this.packages
        .filter(pkg => {
          if (forced.has(pkg.name)) {
            return true;
          }
          return this.hasDiffSinceThatIsntIgnored(pkg, since);
        })
        .forEach(registerUpdated);
    }

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

    const graphDependencies = this.packageGraph.get(packageName).dependencies;

    if (graphDependencies.indexOf(dependency) > -1) {
      this.cache[packageName][dependency] = "dependent";
      return true;
    }

    this.cache[packageName][dependency] = "visited";

    let hasSubDependents = false;

    graphDependencies.forEach(dep => {
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
    const keys = Object.keys(Object.assign({}, this.updatedPackages, this.prereleasedPackages));

    this.packages.forEach(pkg => {
      keys.forEach(dependency => {
        if (this.isPackageDependentOf(pkg.name, dependency)) {
          this.logger.verbose("dependent", "%s depends on %s", pkg.name, dependency);
          dependents[pkg.name] = pkg;
        }
      });
    });

    return dependents;
  }

  isPrereleaseIncrement() {
    const { cdVersion } = this.options;
    return cdVersion && cdVersion.startsWith("pre");
  }

  collectPrereleasedPackages() {
    this.logger.info("", "Checking for prereleased packages...");
    if (this.isPrereleaseIncrement()) {
      return {};
    }

    const prereleasedPackages = {};

    this.packages.forEach(pkg => {
      if (semver.prerelease(pkg.version)) {
        this.logger.verbose("prereleased", pkg.name);
        prereleasedPackages[pkg.name] = pkg;
      }
    });

    return prereleasedPackages;
  }

  collectUpdates() {
    this.logger.silly("collectUpdates");

    return this.packages
      .filter(
        pkg =>
          this.updatedPackages[pkg.name] ||
          this.prereleasedPackages[pkg.name] ||
          (this.options[SECRET_FLAG] ? false : this.dependents[pkg.name]) ||
          this.options.canary
      )
      .map(pkg => {
        this.logger.verbose("has filtered update", pkg.name);
        return new Update(pkg);
      });
  }

  getAssociatedCommits(sha) {
    // if it's a merge commit, it will return all the commits that were part of the merge
    // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
    return `${sha.slice(0, 8)}^..${sha.slice(0, 8)}`;
  }

  hasDiffSinceThatIsntIgnored(pkg, commits) {
    const folder = path.relative(this.repository.rootPath, pkg.location);
    const diff = GitUtilities.diffSinceIn(commits, pkg.location, this.execOpts);

    if (diff === "") {
      return false;
    }

    let changedFiles = diff.split("\n").map(file => file.replace(folder + path.sep, ""));

    if (this.options.ignore) {
      changedFiles = changedFiles.filter(
        file => !_.find(this.options.ignore, pattern => minimatch(file, pattern, { matchBase: true }))
      );
    }

    return !!changedFiles.length;
  }
}
