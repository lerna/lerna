import log from "npmlog";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

module.exports.gitTag = gitTag;

/**
 * @param {string} tag
 * @param {{ forceGitTag: boolean; signGitTag: boolean; }} gitOpts
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
function gitTag(tag, { forceGitTag, signGitTag }, opts, command = "git tag %s -m %s") {
  log.silly("gitTag", tag, command);

  const [cmd, ...args] = command.split(" ");

  const interpolatedArgs = args.map((arg) => arg.replace(/%s/, tag));

  if (forceGitTag) {
    interpolatedArgs.push("--force");
  }

  if (signGitTag) {
    interpolatedArgs.push("--sign");
  }

  // TODO: refactor to address type issues
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  log.verbose(cmd, interpolatedArgs);
  return childProcess.exec(cmd, interpolatedArgs, opts);
}
