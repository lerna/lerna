var getPackageLocation = require("../../utils/getPackageLocation");
var progressBar        = require("../../utils/progressBar");
var child              = require("child_process");
var async              = require("async");
var chalk              = require("chalk");
var fs                 = require("fs");

function execScript(packagesLoc, package, name) {
  // prepublish script
  var script = getPackageLocation(packagesLoc, package) + "/scripts/" + name + ".js";

  // Execute prepublish script if it exists
  if (fs.existsSync(script)) {
    require(script);
  }
}

function execPostpublishScript(packagesLoc, package) {
  execScript(packagesLoc, package, "postpublish");
}

function execPrepublishScript(packagesLoc, package) {
  execScript(packagesLoc, package, "prepublish");
}

module.exports = function npmPublishAsPrerelease(packages, packagesLoc, callback) {
  packages.forEach(function (package) {
    execPrepublishScript(packagesLoc, package);
  });

  console.log("Publishing tagged packages...");

  var tick = progressBar(packages.length);

  async.parallelLimit(packages.map(function (package) {
    var retries = 0;

    return function run(done) {
      var loc = getPackageLocation(packagesLoc, package);

      child.exec("cd " + loc + " && npm publish --tag prerelease", function (err, stdout, stderr) {
        if (err || stderr) {
          err = stderr || err.stack;
          if (err.indexOf("You cannot publish over the previously published version") < 0) {
            if (++retries < 5) {
              console.log(chalk.yellow("Attempting to retry publishing " + package + "..."));
              return run(done);
            } else {
              console.log(chalk.red("Ran out of retries while publishing " + package));
              return done(err);
            }
          } else {
            // publishing over an existing package which is likely due to a timeout or something
            return done();
          }
        }

        tick(package);
        execPostpublishScript(packagesLoc, package);
        done();
      });
    };
  }), 4, callback);
};
