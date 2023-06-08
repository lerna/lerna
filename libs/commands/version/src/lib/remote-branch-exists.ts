import { ExecOptions } from "child_process";
import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

export function remoteBranchExists(gitRemote: string, branch: string, opts: ExecOptions) {
  log.silly("remoteBranchExists", "");

  const remoteBranch = `${gitRemote}/${branch}`;

  try {
    childProcess.execSync("git", ["show-ref", "--verify", `refs/remotes/${remoteBranch}`], opts);
    return true;
  } catch (e) {
    return false;
  }
}
