var bootstrapPackages = require("./bootstrapPackages");
var logger            = require("../../utils/logger");
var exit              = require("../../utils/exit");

module.exports = function bootstrap(config) {
  bootstrapPackages(
    config.packagesLoc,
    config.currentVersion,
    config.flags,
    function(err, packages) {
      if (err) {
        logger.log("error", "Errored while bootstrapping packages.", false, err);
        exit(1);
      } else {
        logger.log("success", "Successfully bootstrapped " + packages.length + " packages.");
        exit(0);
      }
    }
  );
};
