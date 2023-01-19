import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.getCurrentSHA = getCurrentSHA;

/**
 * Retrieve current SHA from git.
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function getCurrentSHA(opts) {
  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("getCurrentSHA");

  const sha = childProcess.execSync("git", ["rev-parse", "HEAD"], opts);
  log.verbose("getCurrentSHA", sha);

  return sha;
}
