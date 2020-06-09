"use strict";

const log = require("npmlog");
const path = require("path");
const slash = require("slash");
const childProcess = require("@lerna/child-process");

module.exports = gitAdd;

function gitAdd(changedFiles, gitOpts, execOpts) {
  // granular pathspecs should be relative to the git root, but that isn't necessarily where lerna lives
  const files = gitOpts.granularPathspec
    ? changedFiles.map(file => slash(path.relative(execOpts.cwd, path.resolve(execOpts.cwd, file))))
    : ".";

  log.silly("gitAdd", files);

  return childProcess.exec("git", ["add", "--", ...files], execOpts);
}
