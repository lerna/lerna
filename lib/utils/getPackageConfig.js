var getPackageLocation = require("./getPackageLocation");
var path               = require("path");

module.exports = function getPackageConfig(packagesLoc, name) {
  var packageLocation = getPackageLocation(packagesLoc, name);
  return require(path.join(packageLocation, "package.json"));
};
