var getPackageLocation = require("../../utils/getPackageLocation");
var gitUtils           = require("../../utils/gitUtils");
var fsUtils            = require("../../utils/fsUtils");
var path               = require("path");

function updateDepsObject(deps, changedPackages, versions) {
  for (var depName in deps) {
    var version = versions[depName];

    if (!version) {
      continue;
    }

    // ensure this was generated and we're on the same major
    if (deps[depName][0] !== "^" || deps[depName][1] !== version[0]) {
      continue;
    }

    deps[depName] = "^" + version;
  }
}

module.exports = function updateChangedPackages(changedPackages, packagesLoc, versions) {
  var changedFiles = [];

  changedPackages.forEach(function (pkg) {
    var packageLoc = getPackageLocation(packagesLoc, pkg.folder);
    var pkgLoc = path.join(packageLoc, "package.json");

    // set new version
    pkg.pkg.version = versions[pkg.name];

    // updated dependencies
    updateDepsObject(pkg.pkg.dependencies, changedPackages, versions);
    updateDepsObject(pkg.pkg.devDependencies, changedPackages, versions);

    // write new package
    fsUtils.writeFileSync(pkgLoc, JSON.stringify(pkg.pkg, null, "  ") + "\n");

    // push to be git committed
    changedFiles.push(pkgLoc);
  });

  changedFiles.forEach(gitUtils.addFile);
};
