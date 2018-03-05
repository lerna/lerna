"use strict";

const path = require("path");

module.exports = getTargetBase;

function getTargetBase(packageConfigs) {
  const straightPackageDirectories = packageConfigs
    .filter(p => path.basename(p) === "*")
    .map(p => path.dirname(p));

  return straightPackageDirectories[0] || "packages";
}
