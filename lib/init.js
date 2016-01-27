var chalk = require("chalk");
var path  = require("path");
var fs    = require("fs");

function ensurePackagesDir(packagesLoc) {
  if (!fs.existsSync(packagesLoc)) {
    console.log("Creating packages folder.");
    fs.mkdirSync(packagesLoc);
  }
}

function ensurePackageJSON(packageLoc, lernaVersion) {
  if (!fs.existsSync(packageLoc)) {
    console.log("Creating package.json");
    fs.writeFileSync(packageLoc, JSON.stringify({
      private: true,
      dependencies: {
        lerna: "^" + lernaVersion,
      }
    }, null, "  "));
  }
}

function ensureVersion(versionLoc) {
  if (fs.existsSync(versionLoc)) {
    return fs.readFileSync(versionLoc, "utf8").trim();
  } else {
    console.log("Creating VERSION file.");
    fs.writeFileSync(versionLoc, "0.0.0");
    return "0.0.0";
  }
}

module.exports = function (cmd, cwd) {
  var version = require("../package.json").version;

  console.log();
  console.log(chalk.bold("Lerna " + cmd +  " v" + version));
  console.log();

  var config = {};

  config.packagesLoc    = path.join(cwd, "packages");
  config.packageLoc     = path.join(cwd, "package.json");
  config.versionLoc     = path.join(cwd, "VERSION");
  config.currentVersion = ensureVersion(config.versionLoc);

  ensurePackagesDir(config.packagesLoc);
  ensurePackageJSON(config.packageLoc, version);

  console.log("Current version: " + config.currentVersion);
  console.log("Version file location: " + config.versionLoc);
  console.log("Packages location: " + config.packagesLoc);
  console.log();

  return config;
};
