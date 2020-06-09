"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports = gitCheckout;

function gitCheckout(stagedFiles, gitOpts, execOpts) {
  const files = gitOpts.granularPathspec ? stagedFiles : ".";

  log.silly("gitCheckout", files);

  return childProcess.exec("git", ["checkout", "--"].concat(files), execOpts);
}
