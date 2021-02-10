"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.gitTag = gitTag;

/**
 * @param {string} tag
 * @param {{ forceGitTag: boolean; signGitTag: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function gitTag(tag, { forceGitTag, signGitTag }, opts) {
  log.silly("gitTag", tag);

  const args = ["tag", tag, "-m", tag];

  if (forceGitTag) {
    args.push("--force");
  }

  if (signGitTag) {
    args.push("--sign");
  }

  log.verbose("git", args);
  return childProcess.exec("git", args, opts);
}
