"use strict";

const minimatch = require("minimatch");
const GitUtilities = require("@lerna/git-utils");

module.exports = makeDiffPredicate;

function makeDiffPredicate(committish, rootPath, execOpts, ignorePatterns = []) {
  const ignoreFilters = new Set(
    Array.from(ignorePatterns).map(p => minimatch.filter(`!${p}`, { matchBase: true }))
  );

  return function hasDiffSinceThatIsntIgnored(node) {
    const diff = GitUtilities.diffSinceIn(committish, node.location, execOpts);

    if (diff === "") {
      return false;
    }

    let changedFiles = diff.split("\n");

    if (ignoreFilters.size) {
      for (const ignored of ignoreFilters) {
        changedFiles = changedFiles.filter(ignored);
      }
    }

    return changedFiles.length > 0;
  };
}
