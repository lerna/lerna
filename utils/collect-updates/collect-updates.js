"use strict";

const log = require("npmlog");
const describeRef = require("@lerna/describe-ref");

const hasTags = require("./lib/has-tags");
const collectPackages = require("./lib/collect-packages");
const getPackagesForOption = require("./lib/get-packages-for-option");
const makeDiffPredicate = require("./lib/make-diff-predicate");

module.exports = collectUpdates;
module.exports.collectPackages = collectPackages;
module.exports.getPackagesForOption = getPackagesForOption;

function collectUpdates(filteredPackages, packageGraph, execOpts, commandOptions) {
  const { forcePublish, conventionalCommits, conventionalGraduate, excludeDependents } = commandOptions;

  // If --conventional-commits and --conventional-graduate are both set, ignore --force-publish
  const useConventionalGraduate = conventionalCommits && conventionalGraduate;
  const forced = getPackagesForOption(useConventionalGraduate ? conventionalGraduate : forcePublish);

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
    log.warn(
      useConventionalGraduate ? "conventional-graduate" : "force-publish",
      forced.has("*") ? "all packages" : Array.from(forced.values()).join("\n")
    );
  }

  if (useConventionalGraduate) {
    // --conventional-commits --conventional-graduate
    if (forced.has("*")) {
      log.info("", "Graduating all prereleased packages");
    } else {
      log.info("", "Graduating prereleased packages");
    }
  } else if (!committish || forced.has("*")) {
    // --force-publish or no tag
    log.info("", "Assuming all packages changed");

    return collectPackages(packages, {
      onInclude: name => log.verbose("updated", name),
      excludeDependents,
    });
  }

  log.info("", `Looking for changed packages since ${committish}`);

  const hasDiff = makeDiffPredicate(committish, execOpts, commandOptions.ignoreChanges);
  const needsBump =
    !commandOptions.bump || commandOptions.bump.startsWith("pre")
      ? () => false
      : /* skip packages that have not been previously prereleased */
        node => node.prereleaseId;
  const isForced = (node, name) =>
    (forced.has("*") || forced.has(name)) && (useConventionalGraduate ? node.prereleaseId : true);

  return collectPackages(packages, {
    isCandidate: (node, name) => isForced(node, name) || needsBump(node) || hasDiff(node),
    onInclude: name => log.verbose("updated", name),
    excludeDependents,
  });
}
