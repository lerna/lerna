import fs from "fs-extra";
import pMap from "p-map";

module.exports.removeTempLicenses = removeTempLicenses;

/**
 * Remove temporary license files.
 * @param {Package[]} packagesToBeLicensed
 */
function removeTempLicenses(packagesToBeLicensed) {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  // TODO: refactor based on TS feedback
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return pMap(packagesToBeLicensed, (pkg) => fs.remove(pkg.licensePath));
}
