var publishChangedPackages = require("./publishChangedPackages");
var chalk                  = require("chalk");

module.exports = function publish(config) {
  publishChangedPackages(
    config.currentVersion,
    config.versionLoc,
    config.packagesLoc,
    function(err, version) {
      if (err) {
        console.log();
        console.error(chalk.red("There was a problem publishing."));
        console.error(err.stack || err);
        process.exit(1);
      } else {
        console.log();
        console.log(chalk.green("Successfully published " + version + "."));
        process.exit();
      }
    }
  );
};
