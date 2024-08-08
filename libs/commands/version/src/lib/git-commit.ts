import { log, tempWrite } from "@lerna/core";
import { ExecOptions } from "child_process";
import { EOL } from "os";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

export interface GitCommitOptions {
  amend?: boolean;
  overrideMessage?: boolean;
  commitHooks?: boolean;
  signGitCommit?: boolean;
  signoffGitCommit?: boolean;
}

export function gitCommit(
  message: string,
  { amend, commitHooks, signGitCommit, signoffGitCommit, overrideMessage }: GitCommitOptions,
  opts: ExecOptions
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

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose("git", args);
  return childProcess.exec("git", args, opts);
}
