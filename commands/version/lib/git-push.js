"use strict";

const log = require("npmlog");
const childProcess = require("@lerna/child-process");

module.exports.gitPush = gitPush;

/**
 * @param {string} remote
 * @param {string} branch
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function gitPush(remote, branch, opts) {
  log.silly("gitPush", remote, branch);

  return childProcess
    .exec("git", ["push", "--follow-tags", "--no-verify", "--atomic", remote, branch], opts)
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

        return childProcess.exec("git", ["push", "--follow-tags", "--no-verify", remote, branch], opts);
      }

      // ensure unexpected errors still break chain
      throw error;
    });
}
