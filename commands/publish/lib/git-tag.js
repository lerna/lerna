"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = gitTag;

function gitTag(tag, opts) {
  log.silly("gitTag", tag);

  return childProcess.exec("git", ["tag", tag, "-m", tag], opts);
}
