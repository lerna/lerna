var runScriptInPackages = require("./runScriptInPackages");
var getPackages         = require("../../utils/getPackages");
var chalk               = require("chalk");

module.exports = function (config) {
  var args = (process.argv || []).slice(3);
  var script = args.shift();

  if (!script) {
    console.error(chalk.red("You must specify which npm script to run."));
    process.exit(1);
  }

  var packages = getPackages(config.packagesLoc).filter(function (pkg) {
    return pkg.pkg.scripts && pkg.pkg.scripts[script];
  });

  if (!packages.length) {
    console.error(chalk.red("No packages found with the npm script '" + script + "'"));
    process.exit(1);
  }

  runScriptInPackages(packages, script, args, function(err) {
    if (err) {
      console.log();
      console.error(chalk.red("There was a problem running npm script '" + script + "' in packages."));
      console.error(err.stack || err);
      process.exit(1);
    } else {
      console.log();
      console.log(chalk.green("Successfully ran npm script '" + script + "' in packages:"));
      console.log(packages.map(function (pkg) {
        return "- " + pkg.name;
      }).join("\n"));
      process.exit();
    }
  });
};
