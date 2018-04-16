"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = getLastCommit;

function getLastCommit(execOpts) {
  if (hasTags(execOpts)) {
    return getLastTaggedCommit(execOpts);
  }

  return getFirstCommit(execOpts);
}

function hasTags(opts) {
  log.silly("hasTags");
  let result = false;

  try {
    result = !!childProcess.execSync("git", ["tag"], opts);
  } catch (err) {
    log.warn("ENOTAGS", "No git tags were reachable from this branch!");
    log.verbose("hasTags error", err);
  }

  log.verbose("hasTags", result);

  return result;
}

function getLastTaggedCommit(opts) {
  log.silly("getLastTaggedCommit");

  const taggedCommit = childProcess.execSync("git", ["rev-list", "--tags", "--max-count=1"], opts);
  log.verbose("getLastTaggedCommit", taggedCommit);

  return taggedCommit;
}

function getFirstCommit(opts) {
  log.silly("getFirstCommit");

  const firstCommit = childProcess.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], opts);
  log.verbose("getFirstCommit", firstCommit);

  return firstCommit;
}
