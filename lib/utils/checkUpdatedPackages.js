var getPackageLocation = require("./getPackageLocation");
var getPackageConfig   = require("./getPackageConfig");
var getPackages        = require("./getPackages");
var progressBar        = require("./progressBar");
var execSync           = require("./execSync");
var chalk              = require("chalk");

module.exports = function checkUpdatedPackages(packagesLoc) {
  var changedPackages = [];
  var FORCE_VERSION = process.env.FORCE_VERSION;
  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  console.log("Checking packages...");

  var packages = getPackages(packagesLoc);
  var packageNames = packages.map(function(pkg) {
    return pkg.name;
  });

  var tick = progressBar(packageNames.length);

  var hasTags = !!execSync("git tag");
  var lastTagCommit;
  var lastTag;

  if (hasTags) {
    lastTagCommit = execSync("git rev-list --tags --max-count=1");
    lastTag = execSync("git describe --tags " + lastTagCommit);
  }

  packageNames.forEach(function (name) {
    var cfg = getPackageConfig(packagesLoc, name);
    tick(name);

    if (cfg.private) return;

    if (!hasTags) {
      changedPackages.push(name);
      return;
    }

    // check if package has changed since last release
    var diff = FORCE_VERSION.indexOf("*") >= 0 || FORCE_VERSION.indexOf(name) >= 0 ||
               execSync("git diff " + lastTag + " -- " + getPackageLocation(packagesLoc, name));
    if (diff) {
      changedPackages.push(name);
    }
  });

  if (!changedPackages.length && !FORCE_VERSION.length) {
    console.error(chalk.red("No updated packages to publish."));
    process.exit(1);
  } else {
    return changedPackages;
  }
};
