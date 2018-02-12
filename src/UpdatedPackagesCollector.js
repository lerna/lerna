"use strict";

const _ = require("lodash");
const minimatch = require("minimatch");
const path = require("path");
const semver = require("semver");

const GitUtilities = require("./GitUtilities");

class Update {
  constructor(pkg) {
    this.package = pkg;
  }
}

function getForcedPackages(forcePublish) {
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

function makeDiffSince(rootPath, execOpts, ignorePatterns) {
  return function hasDiffSinceThatIsntIgnored(pkg, commits) {
    const folder = path.relative(rootPath, pkg.location);
    const diff = GitUtilities.diffSinceIn(commits, pkg.location, execOpts);

    if (diff === "") {
      return false;
    }

    let changedFiles = diff.split("\n").map(file => file.replace(folder + path.sep, ""));

    if (ignorePatterns) {
      changedFiles = changedFiles.filter(
        file => !_.find(ignorePatterns, pattern => minimatch(file, pattern, { matchBase: true }))
      );
    }

    return !!changedFiles.length;
  };
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

    const updatedPackages = this.collectUpdatedPackages();
    const prereleasedPackages = this.collectPrereleasedPackages();
    const dependents = new Set(
      [...updatedPackages, ...prereleasedPackages].reduce(
        (arr, node) => arr.concat(...node.localDependents),
        []
      )
    );

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
        if (updatedPackages.has(node) || prereleasedPackages.has(node) || dependents.has(node)) {
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

    const updatedPackages = new Set();
    const forced = getForcedPackages(forcePublish);

    if (!since || forced.has("*")) {
      this.packages.forEach(node => updatedPackages.add(node));
    } else {
      const hasDiffSinceThatIsntIgnored = makeDiffSince(rootPath, execOpts, ignorePatterns);

      this.packages.forEach((node, name) => {
        if (forced.has(name) || hasDiffSinceThatIsntIgnored(node, since)) {
          updatedPackages.add(node);
        }
      });
    }

    return updatedPackages;
  }

  collectPrereleasedPackages() {
    this.logger.info("", "Checking for prereleased packages...");

    const prereleasedPackages = new Set();

    if ((this.options.cdVersion || "").startsWith("pre")) {
      return prereleasedPackages;
    }

    // skip packages that have not been previously prereleased
    this.packages.forEach((node, name) => {
      if (semver.prerelease(node.version)) {
        this.logger.verbose("prereleased", name);
        prereleasedPackages.add(node);
      }
    });

    return prereleasedPackages;
  }
}

module.exports = UpdatedPackagesCollector;
