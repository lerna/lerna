var gitUtils = require("./utils/gitUtils");
var fsUtils  = require("./utils/fsUtils");
var logger   = require("./utils/logger");
var path     = require("path");
var exit     = require("./utils/exit");

module.exports = function init(command, input, flags) {
  var lernaVersion = require("../package.json").version;

  logger.log("info", "Lerna " + command +  " v" + lernaVersion);

  var rootPath = gitUtils.getTopLevelDirectory();

  if (flags.independent) logger.log("info", "Independent Versioning Mode");
  if (flags.canary) logger.log("info", "Publishing canary build");

  var packagesLoc = path.join(rootPath, "packages");
  var packageLoc = path.join(rootPath, "package.json");
  var versionLoc = path.join(rootPath, "VERSION");

  if (command !== "init") {
    if (!fsUtils.existsSync(packagesLoc)) {
      logger.log("error", "`packages/` directory does not exist, have you run `lerna init`?");
      exit(1);
    }

    if (!fsUtils.existsSync(packageLoc)) {
      logger.log("error", "`package.json` does not exist, have you run `lerna init`?");
      exit(1);
    }

    if (!flags.independent && !fsUtils.existsSync(versionLoc)) {
      logger.log("error", "`VERSION` does not exist, have you run `lerna init`? Or maybe you meant to run this with `--independent` or `-i`?");
      exit(1);
    }
  }

  return {
    lernaVersion: lernaVersion,
    packagesLoc: packagesLoc,
    packageLoc: packageLoc,
    versionLoc: versionLoc,
    command: command,
    input: input,
    flags: flags
  };
};
