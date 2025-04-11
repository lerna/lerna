import { log } from "@lerna/core";
import { ExecOptions } from "child_process";

const childProcess = require("@lerna/child-process");

module.exports.isAnythingCommitted = isAnythingCommitted;

export function isAnythingCommitted(opts: ExecOptions) {
  log.silly("isAnythingCommitted", "");

  const anyCommits = childProcess.execSync("git", ["rev-list", "--count", "--all", "--max-count=1"], opts);

  log.verbose("isAnythingCommitted", anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
