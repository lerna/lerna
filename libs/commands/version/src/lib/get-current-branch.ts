import * as childProcess from "@lerna/child-process";
import { log } from "@lerna/core";
import type { SyncOptions } from "execa";

export function getCurrentBranch(opts: SyncOptions) {
  log.silly("getCurrentBranch", "getting current git branch");

  const branch = childProcess.execSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], opts);
  log.verbose("currentBranch", branch);

  return branch;
}
