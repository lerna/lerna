import { log } from "@lerna/core";
import { ExecOptions } from "child_process";

import * as childProcess from "@lerna/child-process";

export function remoteBranchExists(gitRemote: string, branch: string, opts: ExecOptions) {
  log.silly("remoteBranchExists", "");

  const remoteBranch = `${gitRemote}/${branch}`;

  try {
    childProcess.execSync("git", ["show-ref", "--verify", `refs/remotes/${remoteBranch}`], opts as any);
    return true;
  } catch (e) {
    return false;
  }
}
