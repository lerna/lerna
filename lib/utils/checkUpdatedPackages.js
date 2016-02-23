var getPackageLocation = require("./getPackageLocation");
var getPackageConfig   = require("./getPackageConfig");
var getPackages        = require("./getPackages");
var progressBar        = require("./progressBar");
var getLastSHA         = require("./getLastSHA");
var gitUtils           = require("./gitUtils");
var logger             = require("./logger");
var exit               = require("./exit");

module.exports = function checkUpdatedPackages(packagesLoc, flags) {
  var changedPackages = [];
  var FORCE_VERSION = process.env.FORCE_VERSION;

  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  logger.log("info", "Checking for updated packages...");

  var packages = getPackages(packagesLoc);

  var tick = progressBar(packages.length);

  var hasTags = gitUtils.hasTags();
  var lastTagCommit;
  var commits;

  if (flags.canary) {
    var lastSHA = getLastSHA();
    commits = lastSHA.slice(0, 8) + "^.." + lastSHA.slice(0, 8);
  } else if (hasTags) {
    lastTagCommit = gitUtils.getLastTaggedCommit();
    commits = gitUtils.describeTag(lastTagCommit);
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
    var diff;

    if (FORCE_VERSION.indexOf("*") >= 0) {
      diff = true;
    } else if (FORCE_VERSION.indexOf(pkg.name) >= 0) {
      diff = true;
    } else {
      diff = gitUtils.diffSinceIn(commits, getPackageLocation(packagesLoc, pkg.folder));
    }

    if (diff) {
      changedPackages.push(pkg);
    }
  });

  tick.terminate();

  if (!changedPackages.length && !FORCE_VERSION.length) {
    logger.log("error", "No updated packages to publish.");
    exit(1);
  } else {
    return changedPackages;
  }
};
