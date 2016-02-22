var runScriptInPackages = require("./runScriptInPackages");
var getPackages         = require("../../utils/getPackages");
var logger              = require("../../utils/logger");

module.exports = function (config) {
  var args = (process.argv || []).slice(3);
  var script = args.shift();

  if (!script) {
    logger.log("error", "You must specify which npm script to run.");
  }

  var packages = getPackages(config.packagesLoc).filter(function (pkg) {
    return pkg.pkg.scripts && pkg.pkg.scripts[script];
  });

  if (!packages.length) {
    logger.log("error", "No packages found with the npm script '" + script + "'");
    process.exit(1);
  }

  runScriptInPackages(packages, script, args, function(err) {
    if (err) {
      logger.log("error", "There was a problem running npm script '" + script + "' in packages.", false, err);
      process.exit(1);
    } else {
      logger.log("success", "Successfully ran npm script '" + script + "' in packages:");
      logger.log("success", packages.map(function (pkg) {
        return "- " + pkg.name;
      }).join("\n"));
      process.exit();
    }
  });
};
