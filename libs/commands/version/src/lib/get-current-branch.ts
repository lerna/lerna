import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.getCurrentBranch = getCurrentBranch;

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function getCurrentBranch(opts) {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("getCurrentBranch");

  const branch = childProcess.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
  log.verbose("currentBranch", branch);

  return branch;
}
