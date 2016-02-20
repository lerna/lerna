var getPackages = require("../../utils/getPackages");

module.exports = function (config) {
  var packages = getPackages(config.packagesLoc)
    .filter(function (pkg) {
      return !pkg.pkg.private;
    })
    .map(function (pkg) {
      return "- " + pkg.name;
    })
    .join("\n");

  console.log(packages);
};
