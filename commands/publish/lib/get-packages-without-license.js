"use strict";

const pMap = require("p-map");

const getLicensePath = require("./get-license-path");

module.exports = getPackagesWithoutLicense;

function getPackagesWithoutLicense(packages) {
  return Promise.resolve()
    .then(() => pMap(packages, pkg => getLicensePath(pkg.location)))
    .then(licensePaths => packages.filter((pkg, i) => !licensePaths[i]));
}
