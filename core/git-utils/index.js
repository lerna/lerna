"use strict";

const log = require("npmlog");
const path = require("path");
const slash = require("slash");

const ChildProcessUtilities = require("@lerna/child-process");

function hasTags(opts) {
  log.silly("hasTags");
  let result = false;

  try {
    result = !!ChildProcessUtilities.execSync("git", ["tag"], opts);
  } catch (err) {
    log.warn("ENOTAGS", "No git tags were reachable from this branch!");
    log.verbose("hasTags error", err);
  }

  log.verbose("hasTags", result);

  return result;
}

function getLastTaggedCommit(opts) {
  log.silly("getLastTaggedCommit");

  const taggedCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--tags", "--max-count=1"], opts);
  log.verbose("getLastTaggedCommit", taggedCommit);

  return taggedCommit;
}

function getFirstCommit(opts) {
  log.silly("getFirstCommit");

  const firstCommit = ChildProcessUtilities.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], opts);
  log.verbose("getFirstCommit", firstCommit);

  return firstCommit;
}

function getLastTag(opts) {
  log.silly("getLastTag");

  const lastTag = ChildProcessUtilities.execSync("git", ["describe", "--tags", "--abbrev=0"], opts);
  log.verbose("getLastTag", lastTag);

  return lastTag;
}

function diffSinceIn(committish, location, opts) {
  const args = ["diff", "--name-only", committish];
  const formattedLocation = slash(path.relative(opts.cwd, location));

  if (formattedLocation) {
    // avoid same-directory path.relative() === ""
    args.push("--", formattedLocation);
  }

  log.silly("diffSinceIn", committish, formattedLocation);

  const diff = ChildProcessUtilities.execSync("git", args, opts);
  log.silly("diff", diff);

  return diff;
}

function getCurrentSHA(opts) {
  log.silly("getCurrentSHA");

  const sha = ChildProcessUtilities.execSync("git", ["rev-parse", "HEAD"], opts);
  log.verbose("getCurrentSHA", sha);

  return sha;
}

function getShortSHA(opts) {
  log.silly("getShortSHA");

  const sha = ChildProcessUtilities.execSync("git", ["rev-parse", "--short", "HEAD"], opts);
  log.verbose("getShortSHA", sha);

  return sha;
}

function hasCommit(opts) {
  log.silly("hasCommit");
  let retVal;

  try {
    ChildProcessUtilities.execSync("git", ["log"], opts);
    retVal = true;
  } catch (e) {
    retVal = false;
  }

  log.verbose("hasCommit", retVal);
  return retVal;
}

exports.hasTags = hasTags;
exports.getLastTaggedCommit = getLastTaggedCommit;
exports.getFirstCommit = getFirstCommit;
exports.getLastTag = getLastTag;
exports.diffSinceIn = diffSinceIn;
exports.getCurrentSHA = getCurrentSHA;
exports.getShortSHA = getShortSHA;
exports.hasCommit = hasCommit;
