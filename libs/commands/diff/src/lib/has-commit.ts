import log from "npmlog";
import { ExecOptions } from "child_process";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const childProcess = require("@lerna/child-process");

/**
 * @param {import("child_process").ExecOptions} opts
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
