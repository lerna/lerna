var bootstrapPackages = require("./bootstrapPackages");
var logger            = require("../../utils/logger");

module.exports = function bootstrap(config) {
  bootstrapPackages(
    config.packagesLoc,
    config.currentVersion,
    config.independent,
    function(err, packages) {
      if (err) {
        logger.log("error", err);
        process.exit(1);
      } else {
        logger.log("success", "Successfully bootstrapped " + packages.length + " packages.");
        process.exit();
      }
    }
  );
};
