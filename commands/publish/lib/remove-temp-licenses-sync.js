"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = removeTempLicensesSync;

function removeTempLicensesSync(packages) {
  packages.forEach(pkg => fs.unlinkSync(path.join(pkg.location, "LICENSE")));
}
