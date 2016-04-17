var checkUpdatedPackages = require("../../utils/checkUpdatedPackages");
var findAllDepdendents   = require("../../utils/findAllDependents");
var packageUtils         = require("../../utils/packageUtils");
var logger               = require("../../utils/logger");

function format(packages) {
  return packages.map(function(pkg) {
    return "- " + pkg.name;
  }).join("\n")
}

module.exports = function updated(config) {
  var packages = packageUtils.getPackages(config.packagesLoc);
  var changedPackages = checkUpdatedPackages(config.packagesLoc, config.flags)

  var dependents = findAllDepdendents(packages, changedPackages);

  logger.log("info", "Changed Packages:");
  logger.log("info", format(changedPackages));

  logger.log("info", "Dependent Packages:");
  logger.log("info", format(dependents));
};
