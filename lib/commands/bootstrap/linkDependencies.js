var linkDependenciesForPackage = require("./linkDependenciesForPackage");
var progressBar                = require("../../utils/progressBar");
var mkdirp                     = require("mkdirp");
var child                      = require("child_process");
var async                      = require("async");
var path                       = require("path");

function npmInstallInDir(dir, callback) {
  child.exec("npm install", {
    cwd: dir
  }, function (err, stdout, stderr) {
    if (err != null) {
      callback(stderr);
    } else {
      callback();
    }
  });
}

module.exports = function linkDependencies(packages, packagesLoc, currentVersion, callback) {
  var completed = false;
  var tick = progressBar(packages.length);

  async.parallelLimit(packages.map(function (root) {
    return function (done) {
      var tasks = [];
      var packageLoc = path.join(packagesLoc, root.folder);
      var nodeModulesLoc = path.join(packageLoc, "node_modules");

      tasks.push(function (done) {
        mkdirp(nodeModulesLoc, done);
      });

      tasks.push(function (done) {
        linkDependenciesForPackage(
          root.pkg,
          packages,
          packagesLoc,
          nodeModulesLoc,
          currentVersion,
          done
        );
      });

      tasks.push(function (done) {
        npmInstallInDir(packageLoc, done);
      });

      tasks.push(function (done) {
        if (!completed) tick(root.name);
        done();
      });

      async.series(tasks, done);
    };
  }), 4, function (err) {
    // don't display the ticker if we hit an error and we still have workers
    completed = true;
    callback(err);
  });
}
