"use strict";

const path = require("path");

module.exports.getPackagesWithoutLicense = getPackagesWithoutLicense;

/**
 * Retrieve a list of packages that lack a license file.
 * @param {Project} project
 * @param {Package[]} packagesToPublish
 * @returns {Package[]}
 */
function getPackagesWithoutLicense(project, packagesToPublish) {
  return project.getPackageLicensePaths().then((licensePaths) => {
    // this assumes any existing license is a sibling of package.json, which is pretty safe
    // it also dedupes package locations, since we don't care about duplicate license files
    const licensed = new Set(licensePaths.map((lp) => path.dirname(lp)));

    return packagesToPublish.filter((pkg) => !licensed.has(pkg.location));
  });
}
