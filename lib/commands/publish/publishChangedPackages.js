var updateChangedPackages = require("./updateChangedPackages");
var checkUpdatedPackages  = require("../../utils/checkUpdatedPackages");
var npmPublishSemiAtomic  = require("./npmPublishSemiAtomic");
var readline              = require("readline-sync");
var gitUtils              = require("../../utils/gitUtils");
var fsUtils               = require("../../utils/fsUtils");
var logger                = require("../../utils/logger");
var semver                = require("semver");

function userGetVersion(currentVersion, pkgName) {
  var message = "New version ";
  if (pkgName) message += "for \"" + pkgName + "\" ";
  message += "(Leave blank for patch version): ";

  var input = readline.question(message);

  var ver = semver.valid(input);

  if (!ver) {
    ver = semver.inc(currentVersion, input || "patch");
  }

  if (ver) {
    return ver;
  } else {
    logger.log("info", "Version provided is not valid semver.");
    return userGetVersion(currentVersion, pkgName);
  }
}

function updateVersionFile(versionLoc, version) {
  fsUtils.writeFileSync(versionLoc, version, "utf8");
  gitUtils.addFile(versionLoc);
}

function gitCommitAndTagVersion(version) {
  var tag = "v" + version;
  gitUtils.commit(tag);
  gitUtils.addTag(tag);
  return tag;
}

function gitCommitAndTagVersions(packages, versions) {
  var message = "Publish\n";
  var tags = packages.map(function(pkg) {
    var tag = pkg.name + "@" + versions[pkg.name];
    message += "\n - " + tag;
    return tag;
  });

  gitUtils.commit(message);
  tags.forEach(gitUtils.addTag);
  return tags;
}

function gitRemoveTaggedVersions(tags) {
  logger.log("warning", "Attempting to roll back tag creation.");
  tags.forEach(gitUtils.removeTag);
}

function logChangedPackages(packages, versions) {
  logger.log("info", "Packages to be updated");
  logger.log("info", packages.map(function (pkg) {
    return "- " + pkg.name + "@" + versions[pkg.name];
  }).join("\n"));
}

module.exports = function publishChangedPackages(
  currentVersion,
  versionLoc,
  packagesLoc,
  independent,
  callback
) {
  var changedPackages;
  var masterVersion;
  var versions = {};
  var tags;

  try {
    // Find all changed packages to publish
    changedPackages = checkUpdatedPackages(packagesLoc);

    if (!independent) {
      // Prompt the user for the version
      masterVersion = userGetVersion(currentVersion);
      updateVersionFile(versionLoc, masterVersion);
      logger.log("info", masterVersion);
    }

    changedPackages.forEach(function(pkg) {
      if (independent) {
        versions[pkg.name] = userGetVersion(pkg.version, pkg.name);
      } else {
        versions[pkg.name] = masterVersion;
      }
    });

    // Log them to the console
    logChangedPackages(changedPackages, versions);

    // Go through all the changed packages and update their package.json deps.
    updateChangedPackages(changedPackages, packagesLoc, versions);

    // Add a tag for the new version
    if (independent) {
      tags = gitCommitAndTagVersions(changedPackages, versions);
    } else {
      tags = [gitCommitAndTagVersion(masterVersion)];
    }

    npmPublishSemiAtomic(changedPackages, packagesLoc, versions, function (err) {
      if (err) return onError(err);
      gitUtils.pushWithTags(tags);
      onSuccess();
    });
  } catch (err) {
    onError(err);
  }

  function onSuccess() {
    callback(null, changedPackages, versions);
  }

  function onError(err) {
    // If we got far along to create a tag, remove it.
    if (tags) gitRemoveTaggedVersions(tags);
    callback(err);
  }
}
