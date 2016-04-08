var updateChangedPackages = require("./updateChangedPackages");
var checkUpdatedPackages  = require("../../utils/checkUpdatedPackages");
var npmPublishSemiAtomic  = require("./npmPublishSemiAtomic");
var packageUtils          = require("../../utils/packageUtils");
var unionWith             = require("lodash.unionwith");
var readline              = require("readline-sync");
var gitUtils              = require("../../utils/gitUtils");
var inquirer              = require("inquirer");
var fsUtils               = require("../../utils/fsUtils");
var logger                = require("../../utils/logger");
var semver                = require("semver");
var async                 = require("async");

function promptVersion(currentVersion, pkgName, callback) {
  var patch = semver.inc(currentVersion, "patch");
  var minor = semver.inc(currentVersion, "minor");
  var major = semver.inc(currentVersion, "major");

  var message = "Select a new version";
  if (pkgName) message += " for " + pkgName;
  message += " (currently " + currentVersion + ")";

  inquirer.prompt([{
    type: "list",
    name: "version",
    message: message,
    default: false,
    choices: [
      { value: patch, name: "Patch (" + patch + ")" },
      { value: minor, name: "Minor (" + minor + ")" },
      { value: major, name: "Major (" + major + ")" },
      { value: false, name: "Custom" }
    ]
  }, {
    type: "input",
    name: "custom",
    message: "Enter a custom version",
    filter: semver.valid,
    validate: function (version) {
      return semver.valid(version) ? true : "Must be a valid semver version";
    },
    when: function (answers) {
      return !answers.version; // Only when "Custom"
    }
  }], function (answers) {
    callback(null, answers.version || answers.custom);
  });
}

function getVersions(changedPackages, globalVersion, flags, callback) {
  var versions = {};

  if (flags.canary) {
    var version = globalVersion + "-canary." + gitUtils.getCurrentSHA().slice(0, 8);

    changedPackages.forEach(function (pkg) {
      versions[pkg.name] = version;
    });

    callback(null, {
      version: version,
      versions: versions
    });
  } else if (!flags.independent) {
    promptVersion(globalVersion, null, function (err, version) {
      if (err) return callback(err);

      changedPackages.forEach(function (pkg) {
        versions[pkg.name] = version;
      });

      callback(null, {
        version: version,
        versions: versions
      });
    });
  } else {
    async.mapLimit(changedPackages, 1, function (pkg, cb) {
      promptVersion(pkg.version, pkg.name, cb);
    }, function (err, versions) {
      if (err) return callback(err);

      changedPackages.forEach(function (pkg, index) {
        versions[pkg.name] = versions[index];
      });

      callback(null, {
        version: null,
        versions: versions
      });
    });
  }
}

function confirmVersions(changedPackages, versions, callback) {
  logger.newLine();
  logger.log("info", "Changes:");
  logger.log("info", changedPackages.map(function (pkg) {
    return "- " + pkg.name + ": " + pkg.version + " => " + versions[pkg.name];
  }).join("\n"));
  logger.newLine();

  inquirer.prompt([{
    type: "expand",
    name: "confirm",
    message: "Are you sure you want to publish the above changes?",
    default: 2, // default to help in order to avoid clicking straight through
    choices: [
      { key: 'y', name: 'Yes', value: true },
      { key: 'n', name: 'No',  value: false }
    ]
  }], function (answers) {
    callback(null, answers.confirm);
  });
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

module.exports = function publishChangedPackages(
  versionLoc,
  packagesLoc,
  flags,
  callback
) {
  var changedPackages;
  var masterVersion;
  var versions = {};
  var tags;

  var globalVersion = packageUtils.getGlobalVersion(versionLoc);

  if (!flags.independent) {
    logger.log("info", "Current version: " + globalVersion);
  }

  try {
    // Find all changed packages to publish
    changedPackages = checkUpdatedPackages(packagesLoc, flags);

    getVersions(changedPackages, globalVersion, flags, function(err, results) {
      if (err) return onError(err);

      var version = results.version;
      var versions = results.versions;

      confirmVersions(changedPackages, versions, function(err, confirmed) {
        if (err) return onError(err);
        if (!confirmed) return onSuccess(true);

        if (!flags.independent && !flags.canary) {
          updateVersionFile(versionLoc, version);
        }

        // Go through all the changed packages and update their package.json deps.
        var crossDependentUpdates = updateChangedPackages(changedPackages, packagesLoc, versions, flags);

        if (flags.canary) {
          // count cross dependent packages as changed packages to be updated as well
          changedPackages = unionWith(changedPackages, crossDependentUpdates, function(a, b) {
            return a.loc === b.loc;
          });

          logger.log("info", "Cross Dependent packages to be updated based on changes");
          logger.log("info", crossDependentUpdates.map(function (pkg) {
            return "- " + pkg.name + "@" + pkg.pkg.version;
          }).join("\n"));
        }

        // Add a tag for the new version
        if (flags.independent) {
          tags = gitCommitAndTagVersions(changedPackages, versions);
        } else if (!flags.canary) {
          tags = [gitCommitAndTagVersion(version)];
        }

        logger.newLine();
        logger.log("info", "Publishing packages to npm...");
        npmPublishSemiAtomic(changedPackages, packagesLoc, versions, flags, function (err) {
          if (err) return onError(err);

          if (!flags.canary) {
            logger.log("info", "Pushing tags to git...");
            logger.newLine();
            gitUtils.pushWithTags(tags);
          }

          onSuccess(false);
        });
      });
    });
  } catch (err) {
    onError(err);
  }

  function onSuccess(cancelled) {
    callback(null, {
      cancelled: cancelled,
      changedPackages: changedPackages
    });
  }

  function onError(err) {
    // If we got far along to create a tag, remove it.
    if (tags) gitRemoveTaggedVersions(tags);
    callback(err);
  }
}
