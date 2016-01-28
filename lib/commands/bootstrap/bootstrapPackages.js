var linkDependencies = require("./linkDependencies");
var getPackages      = require("../../utils/getPackages");

module.exports = function bootstrapPackages(packagesLoc, currentVersion, callback) {
  var packages = getPackages(packagesLoc);
  linkDependencies(packages, packagesLoc, currentVersion, function(err) {
    if (err) return callback(err);
    callback(null, packages);
  });
};
