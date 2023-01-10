import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.hasCommit = hasCommit;

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function hasCommit(opts) {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("hasCommit");
  let retVal;

  try {
    childProcess.execSync("git", ["log"], opts);
    retVal = true;
  } catch (e) {
    retVal = false;
  }

  log.verbose("hasCommit", retVal);
  return retVal;
}
