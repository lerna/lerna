"use strict";

const { EOL } = require("os");
const log = require("npmlog");
const tempWrite = require("temp-write");
const childProcess = require("@lerna/child-process");

module.exports = gitCommit;

function gitCommit(message, opts) {
  log.silly("gitCommit", message);
  const args = ["commit", "--no-verify"];

  if (message.indexOf(EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
  } else {
    args.push("-m", message);
  }

  log.verbose("commit", args);
  return childProcess.exec("git", args, opts);
}
