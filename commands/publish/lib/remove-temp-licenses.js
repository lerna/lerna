"use strict";

const fs = require("fs-extra");
const pMap = require("p-map");

module.exports.removeTempLicenses = removeTempLicenses;

/**
 * Remove temporary license files.
 * @param {Package[]} packagesToBeLicensed
 */
function removeTempLicenses(packagesToBeLicensed) {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  return pMap(packagesToBeLicensed, (pkg) => fs.remove(pkg.licensePath));
}
