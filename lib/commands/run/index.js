var progressBar = require("../progress-bar");
var chalk       = require("chalk");
var child       = require("child_process");
var async       = require("async");
var fs          = require("fs");

module.exports = function (config) {
  var scriptPackages = [];
  var runArguments = (process.argv||[]).slice(3);
  var scriptName = runArguments.shift();

  if (!scriptName) {
    console.error(chalk.red("No npm script specified."));
    process.exit(1);
  }

  try {
    findScriptPackages();
    runScript();
  } catch (err) {
    onError(err);
  }

  function getPackageLocation(name) {
    return config.packagesLoc + "/" + name;
  }

  function getPackageConfig(name) {
    return require(getPackageLocation(name) + "/package.json");
  }

  function findScriptPackages() {
    console.log("Checking packages...");

    var packageNames = fs.readdirSync(config.packagesLoc).filter(function (name) {
      return name[0] !== "." && fs.statSync(config.packagesLoc + "/" + name).isDirectory();
    });

    var tick = progressBar(packageNames.length);

    packageNames.forEach(function (name) {
      tick(name);

      var config = getPackageConfig(name);

      if (config.scripts && config.scripts.hasOwnProperty(scriptName)) {
        scriptPackages.push(name);
      }
    });

    if (!scriptPackages.length) {
      console.error(chalk.red("No packages found with the npm script '" + scriptName + "'"));
      process.exit(1);
    }
  }

  function runScript () {
    console.log("Running npm script in packages...");
    var tick = progressBar(scriptPackages.length);

    async.parallelLimit(scriptPackages.map(function (name) {
      return function run(done) {
        var loc = getPackageLocation(name);

        child.exec("cd " + loc + " && npm run " + scriptName + " " + runArguments.join(" "), function (err, stdout, stderr) {
          if (err || stderr) {
            err = stderr || err.stack;
            console.log(chalk.red(err));
            return done(err);
          }

          tick(name);
          done();
        });
      };
    }), 4, function (err) {
      onError(err);
      console.log();
      console.log(chalk.green("Successfully ran npm script '" + scriptName + "' in packages."));
      console.log("Ran in packages:");
      console.log(scriptPackages);
      process.exit();
    });
  }

  function onError(err) {
    if (!err) return;

    console.log();
    console.error(chalk.red("There was a problem running npm script '" + scriptName + "' in packages."));

    console.error(err.stack || err);
    process.exit(1);
  }
};
