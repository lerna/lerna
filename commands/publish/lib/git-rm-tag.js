"use strict";

const childProcess = require("@lerna/child-process");

module.exports = gitRmTag;

function gitRmTag(args, opts) {
  return childProcess.exec("git", ["tag", "-d", ...args], opts);
}
