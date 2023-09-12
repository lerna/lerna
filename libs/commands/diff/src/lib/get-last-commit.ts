import { ExecOpts } from "@lerna/core";
import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

/**
 * @param {import("@lerna/child-process").ExecOpts} execOpts
 */
export function getLastCommit(execOpts?: ExecOpts) {
  if (hasTags(execOpts)) {
    log.silly("getLastTagInBranch", "");
    return childProcess.execSync("git", ["describe", "--tags", "--abbrev=0"], execOpts);
  }
  log.silly("getFirstCommit", "");
  return childProcess.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], execOpts);
}

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function hasTags(opts?: ExecOpts) {
  let result = false;

  try {
    result = !!childProcess.execSync("git", ["tag"], opts);
  } catch (err: any) {
    log.warn("ENOTAGS", "No git tags were reachable from this branch!");
    log.verbose("hasTags error", err);
  }

  log.verbose("hasTags", result.toString());

  return result;
}
