import log from "npmlog";
import pathExists from "path-exists";
import rimraf from "rimraf";

export async function rimrafDir(dirPath: string) {
  log.silly("rimrafDir", dirPath);

  // Short-circuit if we don't have anything to do.
  const fileExists = await pathExists(dirPath);
  if (!fileExists) {
    return;
  }

  const isSuccessful = await rimraf(dirPath);
  if (!isSuccessful) {
    throw new Error(`Failed to fully remove ${dirPath}`);
  }
  log.verbose("rimrafDir", "removed", dirPath);
}
