import * as childProcess from "@lerna/child-process";
import { log } from "@lerna/core";
import type { SyncOptions } from "execa";

/**
 * Creates a git tag with the specified name and options.
 *
 * @param tag - The tag name
 * @param gitOpts - Git tag options
 * @param execOpts - Execution options for child process
 * @param command - Custom git tag command template
 * @param dryRun - If true, only logs what would be done without executing
 * @returns Promise that resolves when operation completes
 */
export function gitTag(
  tag: string,
  { forceGitTag, signGitTag }: { forceGitTag?: boolean; signGitTag?: boolean },
  execOpts: SyncOptions,
  command = "git tag %s -m %s",
  dryRun = false
) {
  log.silly("gitTag", tag, command);

  const [cmd, ...args] = command.split(" ");

  const interpolatedArgs = args.map((arg) => arg.replace(/%s/, tag));

  if (forceGitTag) {
    interpolatedArgs.push("--force");
  }

  if (signGitTag) {
    interpolatedArgs.push("--sign");
  }

  if (dryRun) {
    // Display the command that would be executed
    log.info(
      "dry-run",
      `Would execute: ${cmd} ${interpolatedArgs
        .map((arg) => (arg.includes(" ") ? `"${arg}"` : arg))
        .join(" ")}`
    );
    return Promise.resolve();
  }

  log.verbose("git", `${cmd} ${interpolatedArgs.join(" ")}`);
  return childProcess.exec(cmd, interpolatedArgs, execOpts);
}
