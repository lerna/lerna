var checkUpdatedPackages = require("../../utils/checkUpdatedPackages");

exports.description = "Check which packages have changed since the last release";

exports.execute = function (config) {
  var changedPackages = checkUpdatedPackages(config.packagesLoc)
    .map(function(pkg) {
      return "- " + pkg;
    })
    .join("\n");

  console.log(changedPackages);
};
