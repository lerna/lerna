var progressBar = require("../../utils/progressBar");
var execSync    = require("../../utils/execSync");
var async       = require("async");

module.exports = function npmUpdateAsLatest(changedPackages, version, callback) {
  console.log("Setting latest npm tags...");

  var tick = progressBar(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (package) {
    return function (done) {
      while (true) {
        try {
          console.log("Removing prerelease npm dist-tag");
          execSync("npm dist-tag rm " + package + " prerelease");
          if (process.env.NPM_DIST_TAG) {
            console.log("Adding " + process.env.NPM_DIST_TAG + " npm dist-tag");
            execSync("npm dist-tag add " + package + "@" + version + " " + process.env.NPM_DIST_TAG);
          } else {
            console.log("Adding stable/latest npm dist-tags");
            execSync("npm dist-tag add " + package + "@" + version + " stable");
            execSync("npm dist-tag add " + package + "@" + version + " latest");
          }
          tick(package);
          break;
        } catch (err) {
          console.error(err.stack);
        }
      }
      done();
    };
  }), 4, callback);
};
