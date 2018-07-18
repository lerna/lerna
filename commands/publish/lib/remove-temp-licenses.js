"use strict";

const fs = require("fs-extra");
const pMap = require("p-map");

module.exports = removeTempLicenses;

function removeTempLicenses(packagesToBeLicensed) {
  if (!packagesToBeLicensed.length) {
    return Promise.resolve();
  }

  return pMap(packagesToBeLicensed, pkg => fs.remove(pkg.licensePath));
}
