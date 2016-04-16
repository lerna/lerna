var hasMatchingDependency = require("./hasMatchingDependency");
var npmUtils              = require("../../utils/npmUtils");
var find                  = require("lodash.find");

module.exports = function installExternalPackages(packageLoc, pkg, packages, callback) {
  var deps = Object.keys(pkg.pkg.dependencies || {});
  var devDeps = Object.keys(pkg.pkg.devDependencies || {});

  var externalPackages = deps.concat(devDeps).filter(function (dep) {
    var match = find(packages, function (p) {
      return p.name === dep;
    });

    return !(match && hasMatchingDependency(pkg, match));
  });

  var toInstall = externalPackages.map(function (dep) {
    var version;
    if (pkg.pkg.dependencies) version = pkg.pkg.dependencies[dep];
    if (pkg.pkg.devDependencies && !version) version = pkg.pkg.devDependencies[dep];
    return dep + "@" + version;
  });

  if (toInstall.length) {
    npmUtils.installInDir(packageLoc, toInstall, callback);
  } else {
    callback();
  }
};
