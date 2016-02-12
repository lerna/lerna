var updateChangedPackages = require("./updateChangedPackages");
var checkUpdatedPackages  = require("../../utils/checkUpdatedPackages");
var npmPublishSemiAtomic  = require("./npmPublishSemiAtomic");
var gitAddFile            = require("../../utils/gitAddFile");
var readline              = require("readline-sync");
var execSync              = require("../../utils/execSync");
var semver                = require("semver");
var chalk                 = require("chalk");
var fs                    = require("fs");

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
    console.log("Version provided is not valid semver.");
    return userGetVersion(currentVersion, pkgName);
  }
}

function updateVersionFile(versionLoc, version) {
  fs.writeFileSync(versionLoc, version, "utf8");
  gitAddFile(versionLoc);
}

function gitCommit(message) {
  // Use echo to allow multi\nline strings.
  execSync("git commit -m \"$(echo \"" + message + "\")\"");
}

function gitAddTag(tag) {
  execSync("git tag " + tag);
}

function gitCommitAndTagVersion(version) {
  var tag = "v" + version;
  gitCommit(tag);
  gitAddTag(tag);
  return tag;
}

function gitCommitAndTagVersions(packages, versions) {
  var message = "Publish\n";
  var tags = packages.map(function(pkg) {
    var tag = pkg.name + "@" + versions[pkg.name];
    message += "\n - " + tag;
    return tag;
  });

  gitCommit(message);
  tags.forEach(gitAddTag);
  return tags;
}

function gitRemoveTaggedVersions(tags) {
  console.error(chalk.red("Attempting to roll back tag creation."));
  tags.forEach(function (tag) {
    execSync("git tag -d " + tag);
  });
}

function gitPushWithTags(tags) {
  execSync("git push");
  execSync("git push origin " + tags.join(" "));
}

function logChangedPackages(packages, versions) {
  console.log("Packages to be updated");
  console.log(packages.map(function (pkg) {
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
      console.log(masterVersion);
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
      gitPushWithTags(tags);
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
