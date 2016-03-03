var progressBar = require("../../utils/progressBar");
var npmUtils    = require("../../utils/npmUtils");
var logger      = require("../../utils/logger");
var async       = require("async");

module.exports = function npmUpdateAsLatest(changedPackages, versions, flags, callback) {
  logger.log("info", "Setting latest npm tags...");

  progressBar.init(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (pkg) {
    return function (done) {
      while (true) {
        try {
          if (npmUtils.checkDistTag(pkg.name, "lerna-temp")) {
            logger.log("info", "Removing temporary npm dist-tag");
            npmUtils.removeDistTag(pkg.name, "lerna-temp");
          }

          if (process.env.NPM_DIST_TAG) {
            logger.log("info", "Adding " + process.env.NPM_DIST_TAG + " npm dist-tag");
            npmUtils.addDistTag(pkg.name, versions[pkg.name], process.env.NPM_DIST_TAG);
          } else if (flags.canary) {
            logger.log("info", "Adding canary npm dist-tag");
            npmUtils.addDistTag(pkg.name, pkg.pkg.version, "canary");
          } else {
            logger.log("info", "Adding latest npm dist-tag");
            npmUtils.addDistTag(pkg.name, versions[pkg.name], "latest");
          }
          progressBar.tick(pkg.name);
          break;
        } catch (err) {
          logger.log("error", "Error updating version as latest", false, err);
        }
      }
      done();
    };
  }), 4, function(err) {
    progressBar.terminate();
    callback(err);
  });
};
