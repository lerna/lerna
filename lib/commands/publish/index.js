var publishChangedPackages = require("./publishChangedPackages");
var logger                 = require("../../utils/logger");
var exit                   = require("../../utils/exit");

module.exports = function publish(config) {
  publishChangedPackages(
    config.versionLoc,
    config.packagesLoc,
    config.flags,
    function(err, results) {
      logger.newLine();

      if (err) {
        logger.log("error", "Errored while publishing.", false, err);
        exit(1);
      } else if (results.cancelled) {
        logger.log("info", "Okay bye!");
        exit(0);
      } else {
        var message = "Successfully published:";

        results.changedPackages.forEach(function(pkg) {
          message += "\n - " + pkg.name + "@" + pkg.pkg.version;
        });

        logger.log("success", message);
        exit(0);
      }
    }
  );
};
