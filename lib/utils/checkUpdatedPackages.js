var packageUtils = require("./packageUtils");
var progressBar  = require("./progressBar");
var gitUtils     = require("./gitUtils");
var logger       = require("./logger");
var exit         = require("./exit");

function getAssociatedCommits(sha) {
  // if it's a merge commit, it will return all the commits that were part of the merge
  // ex: If `ab7533e` had 2 commits, ab7533e^..ab7533e would contain 2 commits + the merge commit
  return sha.slice(0, 8) + "^.." + sha.slice(0, 8);
}

module.exports = function checkUpdatedPackages(packagesLoc, flags) {
  var changedPackages = [];
  var FORCE_VERSION = process.env.FORCE_VERSION;

  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  logger.log("info", "Checking for updated packages...");

  var packages = packageUtils.getPackages(packagesLoc);

  progressBar.init(packages.length);

  var hasTags = gitUtils.hasTags();
  var lastTagCommit;
  var commits;

  if (flags.canary) {
    var currentSHA = flags.canary !== true ? flags.canary : gitUtils.getCurrentSHA();
    commits = getAssociatedCommits(currentSHA);
  } else if (hasTags) {
    lastTagCommit = gitUtils.getLastTaggedCommit();
    commits = gitUtils.describeTag(lastTagCommit);
  }

  packages.forEach(function (pkg) {
    var cfg = packageUtils.getPackageConfig(packagesLoc, pkg.folder);

    progressBar.tick(pkg.name);

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
      diff = gitUtils.diffSinceIn(commits, packageUtils.getPackagePath(packagesLoc, pkg.folder));
    }

    if (diff) {
      changedPackages.push(pkg);
    }
  });

  progressBar.terminate();

  if (!changedPackages.length && !FORCE_VERSION.length) {
    logger.log("error", "No updated packages to publish.");
    exit(1);
  } else {
    return changedPackages;
  }
};
