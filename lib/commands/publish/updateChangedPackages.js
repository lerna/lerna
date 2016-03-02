var packageUtils = require("../../utils/packageUtils");
var gitUtils           = require("../../utils/gitUtils");
var fsUtils            = require("../../utils/fsUtils");
var path               = require("path");

function allPackages(packagesLoc) {
  return packageUtils.getPackages(packagesLoc)
  .filter(function (pkg) {
    return !pkg.pkg.private;
  });
}

function updateDepsObject(deps, changedPackages, versions) {
  var updated = false;
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
    // return the updated version if a dependency is updated
    updated = version;
  }

  return updated;
}

module.exports = function updateChangedPackages(changedPackages, packagesLoc, versions, flags) {
  var changedFiles = [];
  var changedCrossDependentPackages = [];
  var packages = flags.canary ? allPackages(packagesLoc) : changedPackages;

  packages.forEach(function (pkg) {
    var packageLoc = packageUtils.getPackagePath(packagesLoc, pkg.folder);
    var pkgLoc = path.join(packageLoc, "package.json");

    // set new version
    pkg.pkg.version = versions[pkg.name] || pkg.pkg.version;

    // update pkg dependencies
    var version = updateDepsObject(pkg.pkg.dependencies, changedPackages, versions) ||
        updateDepsObject(pkg.pkg.devDependencies, changedPackages, versions);

    if (version) {
      changedCrossDependentPackages.push(pkg);
      pkg.pkg.version = version;
    }

    // write new package
    fsUtils.writeFileSync(pkgLoc, JSON.stringify(pkg.pkg, null, "  ") + "\n");

    // push to be git committed
    changedFiles.push(pkgLoc);
  });

  if (!flags.canary) changedFiles.forEach(gitUtils.addFile);
  return changedCrossDependentPackages;
};
