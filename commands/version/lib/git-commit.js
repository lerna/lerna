"use strict";

const { EOL } = require("os");
const log = require("npmlog");
const tempWrite = require("@lerna/temp-write");
const childProcess = require("@lerna/child-process");

module.exports.gitCommit = gitCommit;

/**
 * @param {string} message
 * @param {{ amend: boolean; commitHooks: boolean; signGitCommit: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function gitCommit(message, { amend, commitHooks, signGitCommit, signoffGitCommit }, opts) {
  log.silly("gitCommit", message);
  const args = ["commit"];

  if (commitHooks === false) {
    args.push("--no-verify");
  }

  if (signGitCommit) {
    args.push("--gpg-sign");
  }

  if (signoffGitCommit) {
    args.push("--signoff");
  }

  if (amend) {
    args.push("--amend", "--no-edit");
  } else if (message.indexOf(EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
  } else {
    args.push("-m", message);
  }

  log.verbose("git", args);
  return childProcess.exec("git", args, opts);
}
