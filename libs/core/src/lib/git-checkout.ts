import { ExecOptions } from "child_process";
import log from "./npmlog";

const childProcess = require("@lerna/child-process");

/**
 * Reset files modified by publish steps.
 */
export function gitCheckout(
  stagedFiles: string[],
  gitOpts: { granularPathspec: boolean },
  execOpts: ExecOptions
): Promise<void> {
  const files = gitOpts.granularPathspec ? stagedFiles : ".";

  log.silly("gitCheckout", files as string);

  return childProcess.exec("git", ["checkout", "--"].concat(files), execOpts);
}
