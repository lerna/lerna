"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");

module.exports = createTempLicenses;

function createTempLicenses(srcLicensePath, packagesToBeLicensed) {
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
  packagesToBeLicensed.forEach(pkg => {
    pkg.licensePath = path.join(pkg.location, licenseFileName);
  });

  return pMap(packagesToBeLicensed, pkg => fs.copy(srcLicensePath, pkg.licensePath, options));
}
