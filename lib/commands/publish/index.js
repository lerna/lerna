var publishChangedPackages = require("./publishChangedPackages");
var chalk                  = require("chalk");

module.exports = function publish(config) {
  publishChangedPackages(
    config.currentVersion,
    config.versionLoc,
    config.packagesLoc,
    config.independent,
    function(err, changedPackages, versions) {
      if (err) {
        console.log();
        console.error(chalk.red("There was a problem publishing."));
        console.error(err.stack || err);
        process.exit(1);
      } else {
        var message = "Successfully published:";

        changedPackages.forEach(function(pkg) {
          message += "\n - " + pkg.name + "@" + versions[pkg.name];
        });

        console.log();
        console.log(chalk.green(message));
        process.exit();
      }
    }
  );
};
