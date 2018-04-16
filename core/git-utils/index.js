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

exports.hasTags = hasTags;
exports.getLastTag = getLastTag;
exports.diffSinceIn = diffSinceIn;
