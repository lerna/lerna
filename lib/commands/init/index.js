var fsUtils = require("../../utils/fsUtils");
var logger  = require("../../utils/logger");

function ensurePackagesDir(packagesLoc) {
  if (!fsUtils.existsSync(packagesLoc)) {
    logger.log("info", "Creating packages folder.");
    fsUtils.mkdirSync(packagesLoc);
  }
}

function ensurePackageJSON(packageLoc, lernaVersion) {
  if (!fsUtils.existsSync(packageLoc)) {
    logger.log("info", "Creating package.json.");
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

module.exports = function init(config) {
  ensurePackagesDir(config.packagesLoc);
  ensurePackageJSON(config.packageLoc, config.lernaVersion);
  if (!config.flags.independent) ensureVersion(config.versionLoc);
};
