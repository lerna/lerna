var getPackageLocation = require("../../utils/getPackageLocation");
var progressBar        = require("../../utils/progressBar");
var npmUtils           = require("../../utils/npmUtils");
var fsUtils            = require("../../utils/fsUtils");
var logger             = require("../../utils/logger");
var async              = require("async");
var path               = require("path");

function execScript(packagesLoc, pkg, name) {
  // prepublish script
  var packageLocation = getPackageLocation(packagesLoc, pkg.folder)
  var script = path.join(packageLocation, "scripts", name + ".js");

  // Execute prepublish script if it exists
  if (fsUtils.existsSync(script)) {
    require(script);
  } else {
    logger.log("info", "No " + name + " script found at " + script, true);
  }
}

var execPostpublishScript = logger.logifySync("execPostpublishScript", function (packagesLoc, pkg) {
  execScript(packagesLoc, pkg, "postpublish");
});

var execPrepublishScript = logger.logifySync("execPrepublishScript", function (packagesLoc, pkg) {
  execScript(packagesLoc, pkg, "prepublish");
});

module.exports = function npmPublishAsPrerelease(packages, packagesLoc, callback) {

  packages.forEach(function (pkg) {
    execPrepublishScript(packagesLoc, pkg);
  });

  logger.log("info", "Publishing tagged packages...");

  var tick = progressBar(packages.length);

  async.parallelLimit(packages.map(function (pkg) {
    var retries = 0;

    return function run(done) {
      var loc = getPackageLocation(packagesLoc, pkg.folder);

      logger.log("info", "Publishing " + pkg.name + "...", true);

      npmUtils.publishTaggedInDir("lerna-temp", loc, function(err) {
        if (err) {
          err = err.stack || err;

          if (err.indexOf("You cannot publish over the previously published version") < 0) {
            if (++retries < 5) {
              logger.log("warning", "Attempting to retry publishing " + pkg.name + "...", false, err);
              return run(done);
            } else {
              logger.log("error", "Ran out of retries while publishing " + pkg.name, false, err);
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
  }), 4, function(err) {
    tick.terminate();
    callback(err);
  });
};
