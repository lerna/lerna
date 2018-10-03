"use strict";

const log = require("npmlog");

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

  const committish = commandOptions.since;

  // If committish is set, then looking for changes since the committish
  // If it's not set, then looking for the changes in every package, since last commit they tagged.
  if (committish) {
    log.info("", `Looking for changed packages since ${committish || "initial commit."}`);
  } else {
    log.info("", "Looking for changed packages");
  }

  if (forced.size) {
    // "warn" might seem a bit loud, but it is appropriate for logging anything _forced_
    log.warn("force-publish", forced.has("*") ? "all packages" : Array.from(forced.values()).join("\n"));
  }

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
