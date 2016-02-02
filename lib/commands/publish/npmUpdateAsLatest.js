var progressBar = require("../../utils/progressBar");
var execSync    = require("../../utils/execSync");
var async       = require("async");

module.exports = function npmUpdateAsLatest(changedPackages, versions, callback) {
  console.log("Setting latest npm tags...");

  var tick = progressBar(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (pkg) {
    return function (done) {
      while (true) {
        try {
          console.log("Removing temporary npm dist-tag");
          execSync("npm dist-tag rm " + pkg.name + " lerna-temp");
          if (process.env.NPM_DIST_TAG) {
            console.log("Adding " + process.env.NPM_DIST_TAG + " npm dist-tag");
            execSync("npm dist-tag add " + pkg.name + "@" + versions[pkg.name] + " " + process.env.NPM_DIST_TAG);
          } else {
            console.log("Adding stable/latest npm dist-tags");
            execSync("npm dist-tag add " + pkg.name + "@" + versions[pkg.name] + " stable");
            execSync("npm dist-tag add " + pkg.name + "@" + versions[pkg.name] + " latest");
          }
          tick(pkg.name);
          break;
        } catch (err) {
          console.error(err.stack);
        }
      }
      done();
    };
  }), 4, callback);
};
