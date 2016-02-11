var child = require("child_process");
var pager = require("default-pager");
var chalk = require("chalk");
var path  = require("path");
var fs    = require("fs");

module.exports = function (config, cli) {
  var package = cli.input[1];
  var filePath = "packages";

  if (package) {
    var pkgLoc = path.join(config.packagesLoc, package, "package.json");

    if (!fs.existsSync(pkgLoc)) {
      console.log(chalk.red("Package '" + package + "' does not exist."));
      process.exit(1);
    }

    filePath += "/" + package;
  }

  var diff = child.spawn("git", ["diff", "--color", filePath]);

  diff.stdout.pipe(pager());
};
