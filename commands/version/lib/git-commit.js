"use strict";

const { EOL } = require("os");
const log = require("npmlog");
const tempWrite = require("temp-write");
const childProcess = require("@lerna/child-process");

module.exports = gitCommit;

function gitCommit(message, { amend, commitHooks, signGitCommit }, opts) {
  log.silly("gitCommit", message);
  const args = ["commit"];

  if (commitHooks === false) {
    args.push("--no-verify");
  }

  if (signGitCommit) {
    args.push("--gpg-sign");
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
