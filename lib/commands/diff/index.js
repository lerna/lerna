var child = require("child_process");
var pager = require("default-pager");
var chalk = require("chalk");
var path  = require("path");
var fs    = require("fs");

module.exports = function (config, cli) {
  var packageName = cli.input[1];
  var filePath = "packages";

  if (packageName) {
    var pkgLoc = path.join(config.packagesLoc, packageName, "package.json");

    if (!fs.existsSync(pkgLoc)) {
      console.log(chalk.red("Package '" + packageName + "' does not exist."));
      process.exit(1);
    }

    filePath += "/" + packageName;
  }

  var diff = child.spawn("git", ["diff", "--color", filePath]);

  diff.stdout.pipe(pager());
};
