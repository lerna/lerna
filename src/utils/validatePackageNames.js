"use strict";

const log = require("npmlog");

module.exports = validatePackageNames;

function validatePackageNames(packages) {
  const foundPackages = new Map();

  packages.forEach(({ name, location }) => {
    if (foundPackages.has(name)) {
      foundPackages.get(name).add(location);
    } else {
      foundPackages.set(name, new Set([location]));
    }
  });

  foundPackages.forEach((locationsFound, pkgName) => {
    if (locationsFound.size > 1) {
      log.warn(
        "ENAME",
        `Package name "${pkgName}" used in multiple packages:
          \t${Array.from(locationsFound).join("\n\t")}`
      );
    }
  });
}
