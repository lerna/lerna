var publishChangedPackages = require("./publishChangedPackages");
var logger                 = require("../../utils/logger");
var exit                   = require("../../utils/exit");

module.exports = function publish(config) {
  publishChangedPackages(
    config.currentVersion,
    config.versionLoc,
    config.packagesLoc,
    config.independent,
    function(err, changedPackages, versions) {
      if (err) {
        logger.log("error", "Errored while publishing.", false, err);
        exit(1);
      } else {
        var message = "Successfully published:";

        changedPackages.forEach(function(pkg) {
          message += "\n - " + pkg.name + "@" + versions[pkg.name];
        });

        logger.log("success", message);
        exit(0);
      }
    }
  );
};
