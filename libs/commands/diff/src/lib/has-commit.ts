import log from "npmlog";
import { ExecOpts } from "@lerna/core";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

/**
 * @param {import("@lerna/child-process").ExecOpts} opts
 */
export function hasCommit(opts?: ExecOpts) {
  log.silly("hasCommit", "");
  let retVal: boolean;

  try {
    childProcess.execSync("git", ["log"], opts);
    retVal = true;
  } catch (e) {
    retVal = false;
  }

  log.verbose("hasCommit", retVal.toString());
  return retVal;
}
