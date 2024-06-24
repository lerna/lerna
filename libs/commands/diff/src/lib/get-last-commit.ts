import * as childProcess from "@lerna/child-process";
import { ExecOptions, log } from "@lerna/core";

/**
 *
 * @param execOpts
 * @returns
 */
export function getLastCommit(execOpts?: ExecOptions) {
  if (hasTags(execOpts)) {
    log.silly("getLastTagInBranch", "");
    return childProcess.execSync("git", ["describe", "--tags", "--abbrev=0"], execOpts);
  }
  log.silly("getFirstCommit", "");
  return childProcess.execSync("git", ["rev-list", "--max-parents=0", "HEAD"], execOpts);
}

/**
 *
 * @param opts
 * @returns
 */
function hasTags(opts?: ExecOptions) {
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
