"use strict";

const log = require("npmlog");
const describeRef = require("@lerna/describe-ref");

const hasTags = require("./lib/has-tags");
const collectDependents = require("./lib/collect-dependents");
const getForcedPackages = require("./lib/get-forced-packages");
const makeDiffPredicate = require("./lib/make-diff-predicate");

module.exports = collectUpdates;

function collectUpdates(filteredPackages, packageGraph, execOpts, commandOptions) {
  const forced = getForcedPackages(commandOptions.forcePublish);
  const packages =
    filteredPackages.length === packageGraph.size
      ? packageGraph
      : new Map(filteredPackages.map(({ name }) => [name, packageGraph.get(name)]));

  let committish = commandOptions.since;

  if (hasTags(execOpts)) {
    // describe the last annotated tag in the current branch
    const { sha, refCount, lastTagName } = describeRef.sync(execOpts, commandOptions.includeMergedTags);
    // TODO: warn about dirty tree?

    if (refCount === "0" && forced.size === 0 && !committish) {
      // no commits since previous release
      log.notice("", "Current HEAD is already released, skipping change detection.");

      return [];
    }

    if (commandOptions.canary) {
      // if it's a merge commit, it will return all the commits that were part of the merge
      // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
      committish = `${sha}^..${sha}`;
    } else if (!committish) {
      // if no tags found, this will be undefined and we'll use the initial commit
      committish = lastTagName;
    }
  }

  if (forced.size) {
    // "warn" might seem a bit loud, but it is appropriate for logging anything _forced_
    log.warn("force-publish", forced.has("*") ? "all packages" : Array.from(forced.values()).join("\n"));
  }

  let candidates;

  if (!committish || forced.has("*")) {
    log.info("", "Assuming all packages changed");
    candidates = new Set(packages.values());
  } else {
    log.info("", `Looking for changed packages since ${committish}`);
    candidates = new Set();

    const hasDiff = makeDiffPredicate(committish, execOpts, commandOptions.ignoreChanges);
    const needsBump =
      !commandOptions.bump || commandOptions.bump.startsWith("pre")
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
