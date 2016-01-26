var progressBar = require("../progress-bar");
var chalk       = require("chalk");
var child       = require("child_process");
var fs          = require("fs");

exports.description = "Check which packages have changed since the last release";

exports.execute = function (config) {
  var changedPackages = exports.checkUpdatedPackages(config).map(function(pkg) {
    return "- " + pkg;
  }).join("\n");

  console.log(changedPackages);
}

exports.checkUpdatedPackages = function (config) {
  var changedPackages = [];
  var FORCE_VERSION = process.env.FORCE_VERSION;
  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  console.log("Checking packages...");

  var packageNames = fs.readdirSync(config.packagesLoc).filter(function (name) {
    return name[0] !== "." && fs.statSync(config.packagesLoc + "/" + name).isDirectory();
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
    var cfg = getPackageConfig(config, name);
    tick(name);

    if (cfg.private) return;

    if (!hasTags) {
      changedPackages.push(name);
      return;
    }

    // check if package has changed since last release
    var diff = FORCE_VERSION.indexOf("*") >= 0 || FORCE_VERSION.indexOf(name) >= 0 ||
               execSync("git diff " + lastTag + " -- " + getPackageLocation(config, name));
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
}

function getPackageLocation(config, name) {
  return config.packagesLoc + "/" + name;
}

function getPackageConfig(config, name) {
  return require(getPackageLocation(config, name) + "/package.json");
}

function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
}
