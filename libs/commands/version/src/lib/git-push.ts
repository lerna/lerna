import { log } from "@lerna/core";
import type { SyncOptions } from "execa";

const childProcess = require("@lerna/child-process");

/**
 * Pushes commits and tags to the remote git repository.
 *
 * @param remote - The remote repository name
 * @param branch - The branch name to push
 * @param execOpts - Execution options for child process
 * @param dryRun - If true, only logs what would be done without executing
 * @returns Promise that resolves when operation completes
 */
export function gitPush(remote: string, branch: string, execOpts: SyncOptions, dryRun = false) {
  log.silly("gitPush", remote, branch);

  if (dryRun) {
    log.info("dry-run", `Would execute: git push --follow-tags --no-verify --atomic ${remote} ${branch}`);
    return Promise.resolve();
  }

  return childProcess
    .exec("git", ["push", "--follow-tags", "--no-verify", "--atomic", remote, branch], execOpts)
    .catch((error) => {
      // @see https://github.com/sindresorhus/execa/blob/v1.0.0/index.js#L159-L179
      // the error message _should_ be on stderr except when GIT_REDIRECT_STDERR has been configured to redirect
      // to stdout. More details in https://git-scm.com/docs/git#Documentation/git.txt-codeGITREDIRECTSTDERRcode
      if (
        /atomic/.test(error.stderr) ||
        (process.env.GIT_REDIRECT_STDERR === "2>&1" && /atomic/.test(error.stdout))
      ) {
        // --atomic is only supported in git >=2.4.0, which some crusty CI environments deem unnecessary to upgrade.
        // so let's try again without attempting to pass an option that is almost 5 years old as of this writing...
        log.warn("gitPush", error.stderr);
        log.info("gitPush", "--atomic failed, attempting non-atomic push");

        return childProcess.exec("git", ["push", "--follow-tags", "--no-verify", remote, branch], execOpts);
      }

      // ensure unexpected errors still break chain
      throw error;
    });
}
