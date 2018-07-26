"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

const hasTags = require("./lib/has-tags");
const collectDependents = require("./lib/collect-dependents");
const getForcedPackages = require("./lib/get-forced-packages");
const makeDiffPredicate = require("./lib/make-diff-predicate");

module.exports = collectUpdates;

function collectUpdates(filteredPackages, packageGraph, execOpts, commandOptions) {
  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  let committish = commandOptions.since;

  if (hasTags(execOpts)) {
    if (commandOptions.canary) {
      const sha = childProcess.execSync("git", ["rev-parse", "--short", "HEAD"], execOpts);

      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      // attempt to find the last annotated tag in the current branch
      committish = childProcess.execSync("git", ["describe", "--abbrev=0"], execOpts);
    }
  }

  log.info("", `Looking for changed packages since ${committish || "initial commit"}.`);

  const forced = getForcedPackages(commandOptions.forcePublish);
  let candidates;

  if (!committish || forced.has("*")) {
    candidates = new Set(packages.values());
  } else {
    candidates = new Set();

    const hasDiff = makeDiffPredicate(committish, execOpts, commandOptions.ignoreChanges);
    const needsBump = (commandOptions.bump || "").startsWith("pre")
      ? () => false
      : /* skip packages that have not been previously prereleased */
        node => node.prereleaseId;

    packages.forEach((node, name) => {
      if (forced.has(name) || needsBump(node) || hasDiff(node)) {
        candidates.add(node);
      }
    });
  }

  const dependents = collectDependents(candidates);
  dependents.forEach(node => candidates.add(node));

  // The result should always be in the same order as the input
  const updates = [];

  packages.forEach((node, name) => {
    if (candidates.has(node)) {
      log.verbose("updated", name);

      updates.push(node);
    }
  });

  return updates;
}
