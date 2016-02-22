var npmUtils = require("../../utils/npmUtils");
var logger   = require("../../utils/logger");
var async    = require("async");
var path     = require("path");

module.exports = function runScriptInPackages(packages, script, args, callback) {
  async.parallelLimit(packages.map(function (pkg) {
    return function run(done) {
      npmUtils.runScriptInside(script, args, path.dirname(pkg.loc), function(err, stdout) {
        if (err) {
          logger.log("error", "Run script failed", false, err);
        } else {
          logger.log("info", stdout);
        }
        done(err);
      });
    };
  }), 4, callback);
};
