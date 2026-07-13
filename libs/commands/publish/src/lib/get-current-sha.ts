import { log } from "@lerna/core";
import { ExecOptions } from "child_process";

import * as childProcess from "@lerna/child-process";

/**
 * Retrieve current SHA from git.
 */
export function getCurrentSHA(opts: ExecOptions) {
  log.silly("getCurrentSHA", "");

  const sha = childProcess.execSync("git", ["rev-parse", "HEAD"], opts as any);
  log.verbose("getCurrentSHA", sha);

  return sha;
}
