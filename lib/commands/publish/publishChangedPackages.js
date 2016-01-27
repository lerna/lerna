var updateChangedPackages = require("./updateChangedPackages");
var checkUpdatedPackages  = require("../../utils/checkUpdatedPackages");
var npmPublishSemiAtomic  = require("./npmPublishSemiAtomic");
var gitAddFile            = require("../../utils/gitAddFile");
var readline              = require("readline-sync");
var execSync              = require("../../utils/execSync");
var semver                = require("semver");
var chalk                 = require("chalk");
var fs                    = require("fs");

function userGetVersion(currentVersion) {
  var input = readline.question("New version (Leave blank for patch version): ");

  var ver = semver.valid(input);

  if (!ver) {
    ver = semver.inc(currentVersion, input || "patch");
  }

  if (ver) {
    return ver;
  } else {
    console.log("Version provided is not valid semver.");
    return userGetVersion(currentVersion);
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
}

function gitRemoveTaggedVersion(version) {
  console.error(chalk.red("Attempting to roll back tag creation."));
  execSync("git tag -d v" + version);
}

function gitPushWithTags() {
  execSync("git push --follow-tags");
}

function logChangedPackages(packages) {
  console.log("Packages to be updated");
  console.log(packages.map(function (pkg) {
    return "- " + pkg;
  }).join("\n"));
}

module.exports = function publishChangedPackages(currentVersion, versionLoc, packagesLoc, callback) {
  var changedPackages = [];
  var createdTag = false;

  // Prompt the user for the version
  var version = userGetVersion(currentVersion);
  updateVersionFile(versionLoc, version);
  console.log(version);

  try {
    // Find all changed packages to publish
    changedPackages = checkUpdatedPackages(packagesLoc);

    // Log them to the console
    logChangedPackages(changedPackages);

    // Go through all the changed packages and update their package.json deps.
    updateChangedPackages(changedPackages, packagesLoc, version);

    // Add a tag for the new version
    gitCommitAndTagVersion(version);
    createdTag = true;

    npmPublishSemiAtomic(changedPackages, packagesLoc, version, function (err) {
      if (err) return onError(err);
      gitPushWithTags();
      onSuccess();
    });
  } catch (err) {
    onError(err);
  }

  function onSuccess() {
    callback(version);
  }

  function onError(err) {
    // If we got far along to create a tag, remove it.
    if (createdTag) gitRemoveTaggedVersion(version);
    callback(err);
  }
}
