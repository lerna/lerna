var linkDependenciesForPackage = require("./linkDependenciesForPackage");
var progressBar                = require("../../utils/progressBar");
var npmUtils                   = require("../../utils/npmUtils");
var fsUtils                    = require("../../utils/fsUtils");
var logger                     = require("../../utils/logger");
var async                      = require("async");
var path                       = require("path");

module.exports = function linkDependencies(
  packages,
  packagesLoc,
  currentVersion,
  independent,
  callback
) {
  var completed = false;
  var tick = progressBar(packages.length);

  logger.log("info", "Linking all dependencies", true);

  async.parallelLimit(packages.map(function (root) {
    return function (done) {
      var tasks = [];
      var packageLoc = path.join(packagesLoc, root.folder);
      var nodeModulesLoc = path.join(packageLoc, "node_modules");

      tasks.push(function (done) {
        fsUtils.mkdirp(nodeModulesLoc, done);
      });

      tasks.push(function (done) {
        npmUtils.installInDir(packageLoc, done);
      });

      tasks.push(function (done) {
        linkDependenciesForPackage(
          root.pkg,
          packages,
          packagesLoc,
          nodeModulesLoc,
          currentVersion,
          independent,
          done
        );
      });

      tasks.push(function (done) {
        if (!completed) tick(root.name);
        done();
      });

      async.series(tasks, done);
    };
  }), 4, function (err) {
    tick.terminate();
    // don't display the ticker if we hit an error and we still have workers
    completed = true;
    if (err) {
      logger.log("error", "Errored while linking all dependencies", true, err);
    } else {
      logger.log("success", "Successfully linked all dependencies", true);
    }
    callback(err);
  });
}
