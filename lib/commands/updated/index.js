var checkUpdatedPackages = require("../../utils/checkUpdatedPackages");

module.exports = function updated(config) {
  var changedPackages = checkUpdatedPackages(config.packagesLoc)
    .map(function(pkg) {
      return "- " + pkg.name;
    })
    .join("\n");

  console.log(changedPackages);
};
