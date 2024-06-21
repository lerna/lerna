import { log } from "@lerna/core";
import { ExecOptions } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

export function isBehindUpstream(gitRemote: string, branch: string, opts: ExecOptions) {
  log.silly("isBehindUpstream", "");

  updateRemote(opts);

  const remoteBranch = `${gitRemote}/${branch}`;
  const [behind, ahead] = countLeftRight(`${remoteBranch}...${branch}`, opts);

  log.silly(
    "isBehindUpstream",
    `${branch} is behind ${remoteBranch} by ${behind} commit(s) and ahead by ${ahead}`
  );

  return Boolean(behind);
}

/**
 * @param {import("@lerna/command").ExecOpts} opts
 */
function updateRemote(opts) {
  // git fetch, but for everything
  childProcess.execSync("git", ["remote", "update"], opts);
}

/**
 * @param {string} symmetricDifference
 * @param {import("@lerna/command").ExecOpts} opts
 */
function countLeftRight(symmetricDifference, opts) {
  const stdout = childProcess.execSync(
    "git",
    ["rev-list", "--left-right", "--count", symmetricDifference],
    opts
  );

  return stdout.split("\t").map((val) => parseInt(val, 10));
}
