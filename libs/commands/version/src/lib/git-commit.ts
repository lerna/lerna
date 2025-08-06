import * as childProcess from "@lerna/child-process";
import { log, tempWrite } from "@lerna/core";
import type { SyncOptions } from "execa";
import { EOL } from "node:os";

export interface GitCommitOptions {
  amend?: boolean;
  overrideMessage?: boolean;
  commitHooks?: boolean;
  signGitCommit?: boolean;
  signoffGitCommit?: boolean;
}

/**
 * Creates a git commit with the specified message and options.
 *
 * @param message - The commit message
 * @param gitOpts - Git commit options
 * @param execOpts - Execution options for child process
 * @param dryRun - If true, only logs what would be done without executing
 * @returns Promise that resolves when operation completes
 */
export function gitCommit(
  message: string,
  { amend, commitHooks, signGitCommit, signoffGitCommit, overrideMessage }: GitCommitOptions,
  execOpts: SyncOptions,
  dryRun = false
) {
  log.silly("gitCommit", message);
  const args = ["commit"];

  if (commitHooks === false) {
    args.push("--no-verify");
  }

  if (signGitCommit) {
    args.push("--gpg-sign");
  }

  if (signoffGitCommit) {
    args.push("--signoff");
  }

  const shouldChangeMessage = amend ? amend && overrideMessage : true;
  if (amend) {
    args.push("--amend");
  }

  if (shouldChangeMessage) {
    if (message.indexOf(EOL) > -1) {
      // Use tempfile to allow multi\nline strings.
      args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
    } else {
      args.push("-m", message);
    }
  } else {
    args.push("--no-edit");
  }

  if (dryRun) {
    // Safely escape the message for display
    const displayMessage = message.replace(/"/g, '\\"').replace(/\n/g, "\\\\n");
    log.info("dry-run", `Would execute: git ${args.slice(0, -1).join(" ")} "${displayMessage}"`);
    return Promise.resolve();
  }

  log.verbose("git", args.join(" "));
  return childProcess.exec("git", args, execOpts);
}
