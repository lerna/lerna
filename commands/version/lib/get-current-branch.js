"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = currentBranch;

function currentBranch(opts) {
  log.silly("currentBranch");

  const branch = childProcess.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
  log.verbose("currentBranch", branch);

  return branch;
}
