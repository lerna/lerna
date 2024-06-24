import { log, tempWrite } from "@lerna/core";
import { ExecOptions } from "child_process";
import { EOL } from "os";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

export interface GitCommitOptions {
  amend?: boolean;
  commitHooks?: boolean;
  signGitCommit?: boolean;
  signoffGitCommit?: boolean;
}

export function gitCommit(
  message: string,
  { amend, commitHooks, signGitCommit, signoffGitCommit }: GitCommitOptions,
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

  if (amend) {
    args.push("--amend", "--no-edit");
  } else if (message.indexOf(EOL) > -1) {
    // Use tempfile to allow multi\nline strings.
    args.push("-F", tempWrite.sync(message, "lerna-commit.txt"));
  } else {
    args.push("-m", message);
  }

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose("git", args);
  return childProcess.exec("git", args, opts);
}
