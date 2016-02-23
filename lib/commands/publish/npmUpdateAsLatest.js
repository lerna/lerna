var progressBar = require("../../utils/progressBar");
var npmUtils    = require("../../utils/npmUtils");
var logger      = require("../../utils/logger");
var async       = require("async");

module.exports = function npmUpdateAsLatest(changedPackages, versions, callback) {
  logger.log("info", "Setting latest npm tags...");

  var tick = progressBar(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (pkg) {
    return function (done) {
      while (true) {
        try {
          logger.log("info", "Removing temporary npm dist-tag");
          npmUtils.removeDistTag(pkg.name, "lerna-temp");
          if (process.env.NPM_DIST_TAG) {
            logger.log("info", "Adding " + process.env.NPM_DIST_TAG + " npm dist-tag");
            npmUtils.addDistTag(pkg.name, versions[pkg.name], process.env.NPM_DIST_TAG);
          } else {
            logger.log("info", "Adding latest npm dist-tags");
            npmUtils.addDistTag(pkg.name, versions[pkg.name], "latest");
          }
          tick(pkg.name);
          break;
        } catch (err) {
          logger.log("error", "Error updating version as latest", false, err);
        }
      }
      done();
    };
  }), 4, function(err) {
    tick.terminate();
    callback(err);
  });
};
