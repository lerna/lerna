"use strict";

const semver = require("semver");

const GitUtilities = require("./GitUtilities");
const collectDependents = require("./utils/collect-dependents");
const getForcedPackages = require("./utils/get-forced-packages");
const makeDiffPredicate = require("./utils/make-diff-predicate");

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

class UpdatedPackagesCollector {
  constructor(command) {
    this.execOpts = command.execOpts;
    this.logger = command.logger;
    this.rootPath = command.repository.rootPath;
    this.options = command.options;

    if (command.filteredPackages.length === command.packageGraph.size) {
      this.packages = command.packageGraph;
    } else {
      this.packages = new Map(
        command.filteredPackages.map(({ name }) => [name, command.packageGraph.get(name)])
      );
    }
  }

  getUpdates() {
    this.logger.silly("getUpdates");

    this.candidates = new Set();

    this.collectUpdatedPackages();
    this.collectPrereleasedPackages();

    const dependents = collectDependents(this.candidates);
    dependents.forEach(node => this.candidates.add(node));

    const updates = [];

    const mapper = (node, name) => {
      this.logger.verbose("has filtered update", name);

      // TODO: stop re-wrapping with a silly Update class
      updates.push(new Update(node.pkg));
    };

    if (this.options.canary) {
      this.packages.forEach(mapper);
    } else {
      this.packages.forEach((node, name) => {
        if (this.candidates.has(node)) {
          mapper(node, name);
        }
      });
    }

    return updates;
  }

  collectUpdatedPackages() {
    this.logger.info("", "Checking for updated packages...");

    const { execOpts, options, rootPath } = this;
    const { canary, forcePublish, ignore: ignorePatterns } = options;
    let { since } = options;

    if (GitUtilities.hasTags(execOpts)) {
      if (canary) {
        const sha = GitUtilities.getShortSHA(execOpts);

        // if it's a merge commit, it will return all the commits that were part of the merge
        // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
        since = `${sha}^..${sha}`;
      } else if (!since) {
        since = GitUtilities.getLastTag(execOpts);
      }
    }

    this.logger.info("", `Comparing with ${since || "initial commit"}.`);

    const forced = getForcedPackages(forcePublish);

    if (!since || forced.has("*")) {
      this.packages.forEach(node => this.candidates.add(node));
    } else {
      const hasDiff = makeDiffPredicate(since, rootPath, execOpts, ignorePatterns);

      this.packages.forEach((node, name) => {
        if (forced.has(name) || hasDiff(node)) {
          this.candidates.add(node);
        }
      });
    }
  }

  collectPrereleasedPackages() {
    if ((this.options.cdVersion || "").startsWith("pre")) {
      return;
    }

    this.logger.info("", "Checking for prereleased packages...");

    // skip packages that have not been previously prereleased
    this.packages.forEach((node, name) => {
      if (semver.prerelease(node.version)) {
        this.logger.verbose("prereleased", name);
        this.candidates.add(node);
      }
    });
  }
}

module.exports = UpdatedPackagesCollector;
