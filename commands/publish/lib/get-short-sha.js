"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = getShortSHA;

function getShortSHA(opts) {
  log.silly("getShortSHA");

  const sha = childProcess.execSync("git", ["rev-parse", "--short", "HEAD"], opts);
  log.verbose("getShortSHA", sha);

  return sha;
}
