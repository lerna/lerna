var path = require("path");
var fs   = require("fs");

module.exports = function getPackages(packagesLoc) {
  var packages = [];

  fs.readdirSync(packagesLoc).forEach(function (loc) {
    var name = path.basename(loc);
    if (name[0] === ".") return;

    var pkgLoc = path.join(packagesLoc, name, "package.json");
    if (!fs.existsSync(pkgLoc)) return;

    var pkg = require(pkgLoc);
    packages.push({
      loc: pkgLoc,
      folder: name,
      pkg: pkg,
      name: pkg.name,
      version: pkg.version
    });
  });

  return packages;
}
