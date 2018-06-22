"use strict";

const childProcess = require("@lerna/child-process");
const log = require("npmlog");
const minimatch = require("minimatch");
const path = require("path");
const slash = require("slash");

module.exports = makeDiffPredicate;

function makeDiffPredicate(committish, execOpts, ignorePatterns = []) {
  const ignoreFilters = new Set(ignorePatterns.map(p => minimatch.filter(`!${p}`, { matchBase: true })));

  return function hasDiffSinceThatIsntIgnored(node) {
    const diff = diffSinceIn(committish, node.location, execOpts);

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

function diffSinceIn(committish, location, opts) {
  const args = ["diff", "--name-only", committish];
  const formattedLocation = slash(path.relative(opts.cwd, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    args.push("--", formattedLocation);
  }

  log.silly("diffSinceIn", committish, formattedLocation);

  const diff = childProcess.execSync("git", args, opts);
  log.silly("diff", diff);

  return diff;
}
