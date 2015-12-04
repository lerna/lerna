var chalk = require("chalk");
var path  = require("path");
var fs    = require("fs");

module.exports = function (cmd, cwd) {
  var version = require("../package.json").version;
  console.log();
  console.log(chalk.bold("Lerna " + cmd +  " v" + version));
  console.log();

  var config = {};

  config.packagesLoc = path.join(cwd, "packages");

  if (!fs.existsSync(config.packagesLoc)) {
    console.log("Creating packages folder.");
    fs.mkdirSync(config.packagesLoc);
  }

  config.packageLoc = path.join(cwd, "package.json");

  if (!fs.existsSync(config.packageLoc)) {
    console.log("Creating package.json");
    fs.writeFileSync(config.packageLoc, JSON.stringify({
      private: true,
      dependencies: {
        lerna: "^" + version,
      }
    }, null, "  "));
  }

  config.versionLoc  = path.join(cwd, "VERSION");

  if (fs.existsSync(config.versionLoc)) {
    config.currentVersion = fs.readFileSync(config.versionLoc, "utf8").trim();
  } else {
    console.log("Creating VERSION file.");
    fs.writeFileSync(config.versionLoc, "0.0.0");
    config.currentVersion = "0.0.0";
  }

  console.log("Current version: " + config.currentVersion);
  console.log("Version file location: " + config.versionLoc);
  console.log("Packages location: " + config.packagesLoc);
  console.log();

  return config;
};
