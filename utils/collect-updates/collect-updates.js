"use strict";

const childProcess = require("@lerna/child-process");
const semver = require("semver");

const hasTags = require("./lib/has-tags");
const collectDependents = require("./lib/collect-dependents");
const getForcedPackages = require("./lib/get-forced-packages");
const makeDiffPredicate = require("./lib/make-diff-predicate");

module.exports = collectUpdates;

function collectUpdates({
  filteredPackages,
  packageGraph,
  options: { canary, cdVersion, forcePublish, ignoreChanges, since },
  execOpts,
  logger,
}) {
  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  logger.info("", "Checking for updated packages...");

  let committish = since;

  if (hasTags(execOpts)) {
    if (canary) {
      const sha = childProcess.execSync("git", ["rev-parse", "--short", "HEAD"], execOpts);

      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      // attempt to find the last annotated tag in the current branch
      committish = childProcess.execSync("git", ["describe", "--abbrev=0"], execOpts);
    }
  }

  logger.info("", `Comparing with ${committish || "initial commit"}.`);

  const forced = getForcedPackages(forcePublish);
  let candidates;

  if (!committish || forced.has("*")) {
    candidates = new Set(packages.values());
  } else {
    candidates = new Set();

    const hasDiff = makeDiffPredicate(committish, execOpts, ignoreChanges);
    const needsBump = (cdVersion || "").startsWith("pre")
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

  if (canary || packages.size === candidates.size) {
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
