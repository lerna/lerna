"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = gitAdd;

function gitAdd(files, opts) {
  log.silly("gitAdd", files);

  return childProcess.exec("git", ["add", "--", "."], opts);
}
