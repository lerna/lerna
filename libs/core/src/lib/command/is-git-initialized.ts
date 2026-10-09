import { execaSync, type SyncOptions } from "execa";

export function isGitInitialized(cwd: string): boolean {
  const opts: SyncOptions = {
    cwd,
    // don't throw, just want boolean
    reject: false,
    // only return code, no stdio needed
    stdio: "ignore",
  };
  return execaSync("git", ["rev-parse"], opts).exitCode === 0;
}
