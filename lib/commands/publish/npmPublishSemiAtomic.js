var npmPublishAsPrerelease = require("./npmPublishAsPrerelease");
var npmUpdateAsLatest      = require("./npmUpdateAsLatest");

module.exports = function npmPublishSemiAtomic(packages, packagesLoc, version, callback) {
  // Start by publishing a prerelease that we'll bump later to be more atomic
  npmPublishAsPrerelease(packages, packagesLoc, function (err) {
    if (err) return callback(err);

    // Now that we've successfully published a prerelease set it as the latest
    npmUpdateAsLatest(packages, version, callback);
  });
};
