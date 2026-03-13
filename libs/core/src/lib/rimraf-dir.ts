import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import log from "./npmlog";

export async function rimrafDir(dirPath: string) {
  log.silly("rimrafDir", dirPath);

  // Short-circuit if we don't have anything to do.
  if (!existsSync(dirPath)) {
    return;
  }

  await rm(dirPath, { recursive: true, force: true });
  log.verbose("rimrafDir", "removed", dirPath);
}
