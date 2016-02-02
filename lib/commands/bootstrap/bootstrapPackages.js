var linkDependencies = require("./linkDependencies");
var getPackages      = require("../../utils/getPackages");

module.exports = function bootstrapPackages(packagesLoc, currentVersion, independent, callback) {
  var packages = getPackages(packagesLoc);
  linkDependencies(packages, packagesLoc, currentVersion, independent, function(err) {
    if (err) return callback(err);
    callback(null, packages);
  });
};
