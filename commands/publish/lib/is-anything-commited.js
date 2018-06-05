"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = isAnythingCommited;

function isAnythingCommited(opts) {
  log.silly("isAnythingCommited");

  const anyCommits = childProcess.execSync("git", ["rev-list", "--count", "--all", "--max-count=1"], opts);

  log.verbose("isAnythingCommited", anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
