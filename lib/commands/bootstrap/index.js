var bootstrapPackages = require("./bootstrapPackages");
var chalk             = require("chalk");

exports.description = "Link together local packages and npm install remaining package dependencies";

exports.execute = function (config) {
  bootstrapPackages(config.packagesLoc, config.currentVersion, function(err, packages) {
    if (err) {
      console.error(err);
      console.log();
      process.exit(1);
    } else {
      console.log(chalk.green("Successfully bootstrapped " + packages.length + " packages."));
      console.log();
      process.exit();
    }
  });
};
