import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.gitCheckout = gitCheckout;

/**
 * Reset files modified by publish steps.
 * @param {string[]} stagedFiles
 * @param {{ granularPathspec: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
function gitCheckout(stagedFiles, gitOpts, execOpts) {
  const files = gitOpts.granularPathspec ? stagedFiles : ".";

  log.silly("gitCheckout", files);

  return childProcess.exec("git", ["checkout", "--"].concat(files), execOpts);
}
