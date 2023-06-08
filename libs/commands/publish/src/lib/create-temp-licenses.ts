import { Package } from "@lerna/core";
import fs from "fs-extra";
import pMap from "p-map";
import path from "path";

/**
 * Create temporary license files.
 */
export function createTempLicenses(srcLicensePath: string, packagesToBeLicensed: Package[]) {
  if (!srcLicensePath || !packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  // license file might have an extension, so let's allow it
  const licenseFileName = path.basename(srcLicensePath);
  const options = {
    // make an effort to keep package contents stable over time
    preserveTimestamps: process.arch !== "ia32",
    // (give up on 32-bit architecture to avoid fs-extra warning)
  };

  // store target path for removal later
  packagesToBeLicensed.forEach((pkg) => {
    pkg.licensePath = path.join(pkg.contents, licenseFileName);
  });

  return pMap(packagesToBeLicensed, (pkg) => fs.copy(srcLicensePath, pkg.licensePath, options));
}
