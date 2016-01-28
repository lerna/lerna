var getPackageLocation = require("./getPackageLocation");

module.exports = function getPackageConfig(packagesLoc, name) {
  return require(getPackageLocation(packagesLoc, name) + "/package.json");
};
