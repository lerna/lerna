"use strict";

const matchPackageName = require("@lerna/match-package-name");

module.exports = isHoistedPackage;

function isHoistedPackage(name, hoist, nohoist) {
  return matchPackageName(name, hoist) && matchPackageName(name, nohoist, true);
}
