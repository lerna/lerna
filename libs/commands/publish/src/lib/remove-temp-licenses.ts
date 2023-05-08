import { Package } from "@lerna/core";
import fs from "fs-extra";
import pMap from "p-map";

/**
 * Remove temporary license files.
 */
export function removeTempLicenses(packagesToBeLicensed: Package[]): Promise<unknown> {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  return pMap(packagesToBeLicensed, (pkg) => fs.remove(pkg.licensePath));
}
