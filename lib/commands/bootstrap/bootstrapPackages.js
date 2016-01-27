var linkDependencies = require("./linkDependencies");
var path             = require("path");
var fs               = require("fs");

function getPackages(packagesLoc) {
  var packages = [];

  fs.readdirSync(packagesLoc).forEach(function (loc) {
    var name = path.basename(loc);
    if (name[0] === ".") return;

    var pkgLoc = path.join(packagesLoc, name, "package.json");
    if (!fs.existsSync(pkgLoc)) return;

    var pkg = require(pkgLoc);
    packages.push({
      folder: name,
      pkg: pkg,
      name: pkg.name
    });
  });

  return packages;
}

module.exports = function bootstrapPackages(packagesLoc, currentVersion, callback) {
  var packages = getPackages(packagesLoc);
  linkDependencies(packages, packagesLoc, currentVersion, function(err) {
    if (err) return callback(err);
    callback(null, packages);
  });
};
