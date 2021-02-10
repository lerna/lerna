"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.remoteBranchExists = remoteBranchExists;

/**
 * @param {string} gitRemote
 * @param {string} branch
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function remoteBranchExists(gitRemote, branch, opts) {
  log.silly("remoteBranchExists");

  const remoteBranch = `${gitRemote}/${branch}`;

  try {
    childProcess.execSync("git", ["show-ref", "--verify", `refs/remotes/${remoteBranch}`], opts);
    return true;
  } catch (e) {
    return false;
  }
}
