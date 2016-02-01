var getPackageLocation = require("../../utils/getPackageLocation");
var progressBar        = require("../../utils/progressBar");
var child              = require("child_process");
var async              = require("async");
var chalk              = require("chalk");
var fs                 = require("fs");

function execScript(packagesLoc, pkg, name) {
  // prepublish script
  var script = getPackageLocation(packagesLoc, pkg.folder) + "/scripts/" + name + ".js";

  // Execute prepublish script if it exists
  if (fs.existsSync(script)) {
    require(script);
  }
}

function execPostpublishScript(packagesLoc, pkg) {
  execScript(packagesLoc, pkg, "postpublish");
}

function execPrepublishScript(packagesLoc, pkg) {
  execScript(packagesLoc, pkg, "prepublish");
}

module.exports = function npmPublishAsPrerelease(packages, packagesLoc, callback) {

  packages.forEach(function (pkg) {
    execPrepublishScript(packagesLoc, pkg);
  });

  console.log("Publishing tagged packages...");

  var tick = progressBar(packages.length);

  async.parallelLimit(packages.map(function (pkg) {
    var retries = 0;

    return function run(done) {
      var loc = getPackageLocation(packagesLoc, pkg.folder);

      child.exec("cd " + loc + " && npm publish --tag prerelease", function (err, stdout, stderr) {
        if (err || stderr) {
          err = stderr || err.stack;
          if (err.indexOf("You cannot publish over the previously published version") < 0) {
            if (++retries < 5) {
              console.log(chalk.yellow("Attempting to retry publishing " + pkg.name + "..."));
              return run(done);
            } else {
              console.log(chalk.red("Ran out of retries while publishing " + pkg.name));
              return done(err);
            }
          } else {
            // publishing over an existing package which is likely due to a timeout or something
            return done();
          }
        }

        tick(pkg.name);
        execPostpublishScript(packagesLoc, pkg);
        done();
      });
    };
  }), 4, callback);
};
