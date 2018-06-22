"use strict";

const log = require("npmlog");
const path = require("path");
const slash = require("slash");
const childProcess = require("@lerna/child-process");

module.exports = gitAdd;

function gitAdd(files, opts) {
  log.silly("gitAdd", files);

  const filePaths = files.map(file => slash(path.relative(opts.cwd, path.resolve(opts.cwd, file))));

  return childProcess.exec("git", ["add", "--", ...filePaths], opts);
}
