"use strict";

const fs = require("fs-extra");
const path = require("path");
const pMap = require("p-map");

module.exports = removeTempLicenses;

function removeTempLicenses(packages) {
  return pMap(packages, pkg => fs.unlink(path.join(pkg.location, "LICENSE")));
}
