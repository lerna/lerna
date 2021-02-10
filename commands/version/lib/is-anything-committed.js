"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.isAnythingCommitted = isAnythingCommitted;

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function isAnythingCommitted(opts) {
  log.silly("isAnythingCommitted");

  const anyCommits = childProcess.execSync("git", ["rev-list", "--count", "--all", "--max-count=1"], opts);

  log.verbose("isAnythingCommitted", anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
