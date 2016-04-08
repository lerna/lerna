var npmUpdateAsLatest = require("./npmUpdateAsLatest");
var npmPublishAsTemp  = require("./npmPublishAsTemp");
var execSync          = require("../../utils/execSync");
var logger            = require("../../utils/logger");

module.exports = function npmPublishSemiAtomic(packages, packagesLoc, versions, flags, callback) {
  // Start by publishing a prerelease that we'll bump later to be more atomic
  npmPublishAsTemp(packages, packagesLoc, function (err) {
    if (err) return callback(err);

    if (flags.canary) {
      logger.log("info", "Reseting git state");
      // reset since the package.json files are changed
      execSync("git checkout -- packages/*/package.json");
    }

    // Now that we've successfully published a prerelease set it as the latest
    npmUpdateAsLatest(packages, versions, flags, callback);
  });
};
