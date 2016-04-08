var progressBar = require("../../utils/progressBar");
var npmUtils    = require("../../utils/npmUtils");
var logger      = require("../../utils/logger");
var async       = require("async");

module.exports = function npmUpdateAsLatest(changedPackages, versions, flags, callback) {
  progressBar.init(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (pkg) {
    return function (done) {
      while (true) {
        try {
          if (npmUtils.checkDistTag(pkg.name, "lerna-temp")) {
            npmUtils.removeDistTag(pkg.name, "lerna-temp");
          }

          if (process.env.NPM_DIST_TAG) {
            npmUtils.addDistTag(pkg.name, versions[pkg.name], process.env.NPM_DIST_TAG);
          } else if (flags.canary) {
            npmUtils.addDistTag(pkg.name, pkg.pkg.version, "canary");
          } else {
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
