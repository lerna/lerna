var linkDependencies = require("./linkDependencies");
var packageUtils     = require("../../utils/packageUtils");

module.exports = function bootstrapPackages(packagesLoc, currentVersion, flags, callback) {
  var packages = packageUtils.getPackages(packagesLoc);
  linkDependencies(packages, packagesLoc, currentVersion, flags, function(err) {
    if (err) return callback(err);
    callback(null, packages);
  });
};
