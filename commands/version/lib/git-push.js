"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = gitPush;

function gitPush(remote, branch, opts) {
  log.silly("gitPush", remote, branch);

  return childProcess.exec("git", ["push", "--follow-tags", "--no-verify", remote, branch], opts);
}
