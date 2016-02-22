var checkUpdatedPackages = require("../../utils/checkUpdatedPackages");
var logger = require("../../utils/logger");

module.exports = function updated(config) {
  var changedPackages = checkUpdatedPackages(config.packagesLoc)
    .map(function(pkg) {
      return "- " + pkg.name;
    })
    .join("\n");

  logger.log("info", changedPackages);
};
