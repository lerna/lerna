var fsUtils = require("./fsUtils");
var path    = require("path");

function getGlobalVersion(versionLoc) {
  if (fsUtils.existsSync(versionLoc)) {
    return fsUtils.readFileSync(versionLoc, "utf8").trim();
  }
}

function getPackagesPath(rootPath) {
  return path.join(rootPath, "packages");
}

function getPackagePath(packagesPath, name) {
  return path.join(packagesPath, name);
}

function getPackageConfigPath(packagesPath, name) {
  return path.join(getPackagePath(packagesPath, name), "package.json");
}

function getPackageConfig(packagesPath, name) {
  return require(getPackageConfigPath(packagesPath, name));
}

function getPackages(packagesPath) {
  var packages = [];

  fsUtils.readdirSync(packagesPath).forEach(function (loc) {
    var name = path.basename(loc);
    if (name[0] === ".") return;

    var pkgLoc = getPackageConfigPath(packagesPath, name);
    if (!fsUtils.existsSync(pkgLoc)) return;

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

module.exports = {
  getGlobalVersion: getGlobalVersion,
  getPackagesPath: getPackagesPath,
  getPackagePath: getPackagePath,
  getPackageConfigPath: getPackageConfigPath,
  getPackageConfig: getPackageConfig,
  getPackages: getPackages
};
