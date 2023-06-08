import execa from "execa";

export function isGitInitialized(cwd: string): boolean {
  const opts: execa.SyncOptions = {
    cwd,
    // don't throw, just want boolean
    reject: false,
    // only return code, no stdio needed
    stdio: "ignore",
  };
  return execa.sync("git", ["rev-parse"], opts).exitCode === 0;
}
