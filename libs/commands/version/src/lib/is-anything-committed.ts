import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.isAnythingCommitted = isAnythingCommitted;

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function isAnythingCommitted(opts) {
  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.silly("isAnythingCommitted");

  const anyCommits = childProcess.execSync("git", ["rev-list", "--count", "--all", "--max-count=1"], opts);

  log.verbose("isAnythingCommitted", anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
