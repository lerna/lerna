var getPackages = require("../../utils/getPackages");
var logger      = require("../../utils/logger");

module.exports = function (config) {
  var packages = getPackages(config.packagesLoc)
    .filter(function (pkg) {
      return !pkg.pkg.private;
    })
    .map(function (pkg) {
      return "- " + pkg.name;
    })
    .join("\n");

  logger.log("info", packages);
};
