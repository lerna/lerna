import { log } from "@lerna/core";
import { ExecOptions } from "child_process";

import * as childProcess from "@lerna/child-process";

export function isAnythingCommitted(opts: ExecOptions) {
  log.silly("isAnythingCommitted", "");

  const anyCommits = childProcess.execSync(
    "git",
    ["rev-list", "--count", "--all", "--max-count=1"],
    opts as any
  );

  log.verbose("isAnythingCommitted", anyCommits);

  return Boolean(parseInt(anyCommits, 10));
}
