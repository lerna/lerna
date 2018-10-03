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
    const { lastTagCommittish, lastCommittish } = lastCommitInfo(node.location, execOpts);

    // No updates for this package. The last commit tag is the version tag.
    if (lastTagCommittish === lastCommittish) {
      return false;
    }

    // There is no tag for this package, and the since committish is not set
    if (lastTagCommittish === "" && !committish) {
      return true;
    }

    const since = committish || lastTagCommittish;

    const diff = diffSinceIn(since, node.location, execOpts);

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

// Get the last one commit, and the last one commit which contains a version tag.
function lastCommitInfo(location, opts) {
  const getTagsArg = ["log", "-1", "--no-walk", "--tags", '--pretty="%h"'];
  const lastArg = ["log", "-1", '--pretty="%h"'];
  const formattedLocation = slash(path.relative(opts.cwd, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    getTagsArg.push(formattedLocation);
    lastArg.push(formattedLocation);
  }
  log.silly("lastCommitInfo", formattedLocation);
  const lastTagCommittish = childProcess.execSync("git", getTagsArg, opts).replace(/"/g, "");
  const lastCommittish = childProcess.execSync("git", lastArg, opts).replace(/"/g, "");

  return {
    lastTagCommittish,
    lastCommittish,
  };
}
