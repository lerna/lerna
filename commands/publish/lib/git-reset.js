"use strict";

const childProcess = require("@lerna/child-process");

module.exports = getReset;

function getReset(args, opts) {
  return childProcess.exec("git", ["reset", args, "--hard"], opts);
}
