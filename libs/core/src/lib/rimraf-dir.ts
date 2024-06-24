import { existsSync } from "fs";
import rimraf from "rimraf";
import log from "./npmlog";

export async function rimrafDir(dirPath: string) {
  log.silly("rimrafDir", dirPath);

  // Short-circuit if we don't have anything to do.
  if (!existsSync(dirPath)) {
    return;
  }

  const isSuccessful = await rimraf(dirPath);
  if (!isSuccessful) {
    throw new Error(`Failed to fully remove ${dirPath}`);
  }
  log.verbose("rimrafDir", "removed", dirPath);
}
