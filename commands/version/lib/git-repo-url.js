"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = getRepoUrl;

function getRepoUrl(opts) {
  log.silly("getRepoUrl");

  const args = ["config", "--get", "remote.origin.url"];

  log.verbose("git", args);

  return childProcess.exec("git", args, opts);
}
