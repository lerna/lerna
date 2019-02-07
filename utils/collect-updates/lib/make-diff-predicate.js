"use strict";

const childProcess = require("@lerna/child-process");
const log = require("npmlog");
const minimatch = require("minimatch");
const path = require("path");
const slash = require("slash");

module.exports = makeDiffPredicate;

function makeDiffPredicate(committish, execOpts, ignorePatterns = []) {
  const ignoreFilters = new Set(
    ignorePatterns.map(p =>
      minimatch.filter(`!${p}`, {
        matchBase: true,
        // dotfiles inside ignored directories should also match
        dot: true,
      })
    )
  );

  if (ignoreFilters.size) {
    log.info("ignoring diff in paths matching", ignorePatterns);
  }

  return function hasDiffSinceThatIsntIgnored(node) {
    const diff = diffSinceIn(committish, node.location, execOpts);

    if (diff === "") {
      log.silly("", "no diff found in %s", node.name);
      return false;
    }

    log.silly("found diff in", diff);
    let changedFiles = diff.split("\n");

    if (ignoreFilters.size) {
      for (const ignored of ignoreFilters) {
        changedFiles = changedFiles.filter(ignored);
      }
    }

    if (changedFiles.length) {
      log.verbose("filtered diff", changedFiles);
    } else {
      log.verbose("", "no diff found in %s (after filtering)", node.name);
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

  log.silly("checking diff", formattedLocation);
  return childProcess.execSync("git", args, opts);
}
