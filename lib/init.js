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

module.exports = function init(cmd, cwd, independent) {
  var version = require("../package.json").version;

  console.log();
  console.log(chalk.bold("Lerna " + cmd +  " v" + version));
  console.log();

  if (independent) {
    console.log(chalk.bold("Independent Versioning Mode"));
    console.log();
  }

  var config = {};

  config.independent = !!independent;

  config.packagesLoc = path.join(cwd, "packages");
  config.packageLoc  = path.join(cwd, "package.json");

  if (!independent) {
    config.versionLoc     = path.join(cwd, "VERSION");
    config.currentVersion = ensureVersion(config.versionLoc);
  }

  ensurePackagesDir(config.packagesLoc);
  ensurePackageJSON(config.packageLoc, version);

  if (!independent) {
    console.log("Current version: " + config.currentVersion);
    console.log("Version file location: " + config.versionLoc);
  }

  console.log("Packages location: " + config.packagesLoc);
  console.log();

  return config;
};
