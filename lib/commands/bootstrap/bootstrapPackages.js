var linkDependencies = require("./linkDependencies");
var packageUtils     = require("../../utils/packageUtils");

module.exports = function bootstrapPackages(packagesLoc, versionLoc, flags, callback) {
  var packages = packageUtils.getPackages(packagesLoc);
  var currentVersion = packageUtils.getGlobalVersion(versionLoc);
  linkDependencies(packages, packagesLoc, currentVersion, flags, function(err) {
    if (err) return callback(err);
    callback(null, packages);
  });
};
