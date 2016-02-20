var gitGetLastTaggedCommit = require("./gitGetLastTaggedCommit");
var getPackageLocation     = require("./getPackageLocation");
var getPackageConfig       = require("./getPackageConfig");
var getPackages            = require("./getPackages");
var progressBar            = require("./progressBar");
var gitHasTags             = require("./gitHasTags");
var execSync               = require("./execSync");
var chalk                  = require("chalk");

module.exports = function checkUpdatedPackages(packagesLoc) {
  var changedPackages = [];
  var FORCE_VERSION = process.env.FORCE_VERSION;
  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  console.log("Checking packages...");

  var packages = getPackages(packagesLoc);

  var tick = progressBar(packages.length);

  var hasTags = gitHasTags();
  var lastTagCommit;
  var lastTag;

  if (hasTags) {
    lastTagCommit = gitGetLastTaggedCommit();
    lastTag = execSync("git describe --tags " + lastTagCommit);
  }

  packages.forEach(function (pkg) {
    var cfg = getPackageConfig(packagesLoc, pkg.folder);
    tick(pkg.name);

    if (cfg.private) return;

    if (!hasTags) {
      changedPackages.push(pkg);
      return;
    }

    // check if package has changed since last release
    var diff = FORCE_VERSION.indexOf("*") >= 0 || FORCE_VERSION.indexOf(pkg.name) >= 0 ||
               execSync("git diff " + lastTag + " -- " + getPackageLocation(packagesLoc, pkg.folder));
    if (diff) {
      changedPackages.push(pkg);
    }
  });

  if (!changedPackages.length && !FORCE_VERSION.length) {
    console.error(chalk.red("No updated packages to publish."));
    process.exit(1);
  } else {
    return changedPackages;
  }
};
