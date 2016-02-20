var npmUpdateAsLatest = require("./npmUpdateAsLatest");
var npmPublishAsTemp  = require("./npmPublishAsTemp");

module.exports = function npmPublishSemiAtomic(packages, packagesLoc, versions, callback) {
  // Start by publishing a prerelease that we'll bump later to be more atomic
  npmPublishAsTemp(packages, packagesLoc, function (err) {
    if (err) return callback(err);

    // Now that we've successfully published a prerelease set it as the latest
    npmUpdateAsLatest(packages, versions, callback);
  });
};
