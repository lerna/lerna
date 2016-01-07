var chalk       = require("chalk");
var child       = require("child_process");
var async       = require("async");
var fs          = require("fs");

exports.description = "List all public packages";

exports.execute = function (config) {
  var packages = [];

  try {
    listPackages();
  } catch (err) {
    onError(err);
  }

  function getPackageLocation(name) {
    return config.packagesLoc + "/" + name;
  }

  function getPackageConfig(name) {
    return require(getPackageLocation(name) + "/package.json");
  }

  function listPackages () {
    var packageNames = fs.readdirSync(config.packagesLoc).filter(function (name) {
      return name[0] !== "." && fs.statSync(config.packagesLoc + "/" + name).isDirectory();
    });

    packageNames = packageNames.filter(function (name) {
      try {
        var config = getPackageConfig(name);
        return !config.private;
      }
      catch (e) {
        return false;
      }
    });

    if (!packageNames.length) {
      console.error(chalk.yellow("No public packages found."));
      return;
    }

    console.log(chalk.green("Found public packages:"));
    console.log(packageNames);
  }

  function onError(err) {
    if (!err) return;

    console.log();
    console.error(chalk.red("There was a problem listing packages."));

    console.error(err.stack || err);
    process.exit(1);
  }
};
