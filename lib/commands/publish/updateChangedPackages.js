var getPackageLocation = require("../../utils/getPackageLocation");
var gitAddFile            = require("../../utils/gitAddFile");
var fs                 = require("fs");

function updateDepsObject(deps, changedPackages, version) {
  for (var depName in deps) {
    // ensure this was generated and we're on the same major
    if (deps[depName][0] !== "^" || deps[depName][1] !== version[0]) continue;

    if (changedPackages.indexOf(depName) >= 0) {
      deps[depName] = "^" + version;
    }
  }
}

module.exports = function updateChangedPackages(changedPackages, packagesLoc, version) {
  var changedFiles = [];

  changedPackages.forEach(function (name) {
    var pkgLoc = getPackageLocation(packagesLoc, name) + "/package.json";
    var pkg = require(pkgLoc);

    // set new version
    pkg.version = version;

    // updated dependencies
    updateDepsObject(pkg.dependencies, changedPackages, version);
    updateDepsObject(pkg.devDependencies, changedPackages, version);

    // write new package
    fs.writeFileSync(pkgLoc, JSON.stringify(pkg, null, "  ") + "\n");

    // push to be git committed
    changedFiles.push(pkgLoc);
  });

  changedFiles.forEach(gitAddFile);
};
