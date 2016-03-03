var fsUtils = require("./utils/fsUtils");
var logger  = require("./utils/logger");
var path    = require("path");

function ensurePackagesDir(packagesLoc) {
  if (!fsUtils.existsSync(packagesLoc)) {
    logger.log("info", "Creating packages folder.");
    fsUtils.mkdirSync(packagesLoc);
  }
}

function ensurePackageJSON(packageLoc, lernaVersion) {
  if (!fsUtils.existsSync(packageLoc)) {
    logger.log("info", "Creating package.json");
    fsUtils.writeFileSync(packageLoc, JSON.stringify({
      private: true,
      dependencies: {
        lerna: "^" + lernaVersion,
      }
    }, null, "  "));
  }
}

function ensureVersion(versionLoc) {
  if (fsUtils.existsSync(versionLoc)) {
    return fsUtils.readFileSync(versionLoc, "utf8").trim();
  } else {
    logger.log("info", "Creating VERSION file.");
    fsUtils.writeFileSync(versionLoc, "0.0.0");
    return "0.0.0";
  }
}

module.exports = function init(cmd, cwd, flags) {
  var version = require("../package.json").version;

  logger.log("info", "Lerna " + cmd +  " v" + version);

  if (flags.independent) {
    logger.log("info", "Independent Versioning Mode");
  }

  if (flags.canary) {
    logger.log("info", "Publishing canary build");
  }

  var config = {};

  config.flags = flags;

  config.packagesLoc = path.join(cwd, "packages");
  config.packageLoc  = path.join(cwd, "package.json");

  if (!flags.independent) {
    config.versionLoc     = path.join(cwd, "VERSION");
    config.currentVersion = ensureVersion(config.versionLoc);
  }

  ensurePackagesDir(config.packagesLoc);
  ensurePackageJSON(config.packageLoc, version);

  if (!flags.independent) {
    logger.log("info", "Current version: " + config.currentVersion);
    logger.log("info", "Version file location: " + config.versionLoc);
  }

  logger.log("info", "Packages location: " + config.packagesLoc);

  return config;
};
