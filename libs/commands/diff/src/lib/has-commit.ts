import log from "npmlog";
import { ExecOptions } from "@lerna/core";
import * as childProcess from "@lerna/child-process";
/**
 *
 * @param opts
 * @returns
 */
export function hasCommit(opts?: ExecOptions) {
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
