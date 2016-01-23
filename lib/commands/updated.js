var progressBar = require("../progress-bar");
var chalk       = require("chalk");
var child       = require("child_process");
var fs          = require("fs");
var path        = require("path");
var log         = require("debug")("lerna:updated");

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

  var packageDirNames = fs.readdirSync(config.packagesLoc).filter(function (name) {
    return name[0] !== "." && fs.statSync(config.packagesLoc + "/" + name).isDirectory();
  });

  var tick = progressBar(packageDirNames.length);

  var hasTags = !!execSync("git tags");
  var lastTagCommit;
  var lastTag;

  if (hasTags) {
    lastTagCommit = execSync("git rev-list --tags --max-count=1");
    lastTag = execSync("git describe --tags " + lastTagCommit);
  }

  packageDirNames.forEach(function (pkgDirName) {
    var cfg = getPackageConfig(config, pkgDirName);
    tick(pkgDirName);

    if (cfg.private) return;

    var pkgObject = {
      dirName: pkgDirName,
      pkgName: cfg.name
    };

    if (!hasTags) {
      changedPackages.push(pkgObject);
      return;
    }

    // check if package has changed since last release
    var diff = FORCE_VERSION.indexOf("*") >= 0 || FORCE_VERSION.indexOf(pkgDirName) >= 0 ||
               execSync("git diff " + lastTag + " -- " + getPackageLocation(config, pkgDirName));

    if (diff) {
      changedPackages.push(pkgObject);
    }
  });

  log("dectected packages for update (%s)", changedPackages.map(function (obj) { return obj.pkgName}).join(","));

  if (!changedPackages.length && !FORCE_VERSION.length) {
    console.error(chalk.red("No updated packages to publish."));
    process.exit(1);
  } else {
    return changedPackages;
  }
}

function getPackageLocation(config, name) {
  return path.join(config.packagesLoc, name);
}

function getPackageConfig(config, name) {
  return require(path.join(getPackageLocation(config, name), "package.json"));
}

function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
}
