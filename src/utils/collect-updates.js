"use strict";

const semver = require("semver");

const GitUtilities = require("../GitUtilities");
const collectDependents = require("./collect-dependents");
const getForcedPackages = require("./get-forced-packages");
const makeDiffPredicate = require("./make-diff-predicate");

module.exports = collectUpdates;

function collectUpdates({ filteredPackages, packageGraph, options, rootPath, execOpts, logger, gitEnabled }) {
  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  logger.info("", "Checking for updated packages...");

  let { since: committish } = options;

  if (gitEnabled && GitUtilities.hasTags(execOpts)) {
    if (options.canary) {
      const sha = GitUtilities.getShortSHA(execOpts);

      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      committish = GitUtilities.getLastTag(execOpts);
    }
  }

  logger.info("", `Comparing with ${committish || "initial commit"}.`);

  const forced = getForcedPackages(options.forcePublish);
  let candidates;

  if (!committish || forced.has("*")) {
    candidates = new Set(packages.values());
  } else {
    candidates = new Set();

    const hasDiff = makeDiffPredicate(committish, rootPath, execOpts, options.ignore);
    const needsBump = (options.cdVersion || "").startsWith("pre")
      ? () => false
      : /* skip packages that have not been previously prereleased */
        node => semver.prerelease(node.version);

    packages.forEach((node, name) => {
      if (forced.has(name) || needsBump(node) || hasDiff(node)) {
        candidates.add(node);
      }
    });
  }

  const dependents = collectDependents(candidates);
  dependents.forEach(node => candidates.add(node));

  if (options.canary || packages.size === candidates.size) {
    logger.verbose("updated", "(short-circuit)");

    return Array.from(candidates);
  }

  const updates = [];

  packages.forEach((node, name) => {
    if (candidates.has(node)) {
      logger.verbose("updated", name);

      updates.push(node);
    }
  });

  return updates;
}
