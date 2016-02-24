var path = require("path");

module.exports = function getPackageLocation(packagesLoc, name) {
  return path.join(packagesLoc, name);
};
