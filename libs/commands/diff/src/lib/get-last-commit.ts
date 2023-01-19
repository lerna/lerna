import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.getLastCommit = getLastCommit;

/**
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
function getLastCommit(execOpts) {
  if (hasTags(execOpts)) {
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.silly("getLastTagInBranch");

    return childProcess.execSync("git", ["describe", "--tags", "--abbrev=0"], execOpts);
  }

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("getFirstCommit");
  return childProcess.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], execOpts);
}

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function hasTags(opts) {
  let result = false;

  try {
    result = !!childProcess.execSync("git", ["tag"], opts);
  } catch (err) {
    log.warn("ENOTAGS", "No git tags were reachable from this branch!");
    log.verbose("hasTags error", err);
  }

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose("hasTags", result);

  return result;
}
