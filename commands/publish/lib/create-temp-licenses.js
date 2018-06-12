"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");

module.exports = createTempLicenses;

function createTempLicenses(srcLicensePath, packages) {
  if (!srcLicensePath || !packages.length) {
    return Promise.resolve();
  }
  return Promise.resolve()
    .then(() => fs.readFile(srcLicensePath, { encoding: "utf8" }))
    .then(srcLicenseText =>
      pMap(packages, pkg => fs.writeFile(path.join(pkg.location, "LICENSE"), srcLicenseText))
    );
}
