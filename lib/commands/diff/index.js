var gitUtils = require("../../utils/gitUtils");
var fsUtils  = require("../../utils/fsUtils");
var logger   = require("../../utils/logger");
var child    = require("child_process");
var path     = require("path");
var exit     = require("../../utils/exit");

module.exports = function (config) {
  var packageName = config.input[1];
  var filePath = "packages";

  if (packageName) {
    var pkgLoc = path.join(config.packagesLoc, packageName, "package.json");

    if (!fsUtils.existsSync(pkgLoc)) {
      logger.log("error", "Package '" + packageName + "' does not exist.");
      exit(1);
    }

    filePath = path.join(filePath, packageName);
  }

  var hasTags = gitUtils.hasTags();
  var lastCommit;

  if (hasTags) {
    lastCommit = gitUtils.getLastTaggedCommit();
  } else {
    lastCommit = gitUtils.getFirstCommit();
  }

  child.spawn("git", ["diff", lastCommit, "--color=auto", filePath], {
    stdio: "inherit"
  });
};
