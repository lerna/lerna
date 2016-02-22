var gitGetLastTaggedCommit = require("../../utils/gitGetLastTaggedCommit");
var gitHasTags             = require("../../utils/gitHasTags")
var execSync               = require("../../utils/execSync");
var child                  = require("child_process");
var chalk                  = require("chalk");
var path                   = require("path");
var fs                     = require("fs");

function gitGetFirstCommit() {
  execSync("git rev-list --max-parents=0 HEAD");
}

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

  var hasTags = gitHasTags();
  var lastCommit;

  if (hasTags) {
    lastCommit = gitGetLastTaggedCommit();
  } else {
    lastCommit = gitGetFirstCommit();
  }

  child.spawn("git", ["diff", lastCommit, "--color=auto", filePath], {
    stdio: "inherit"
  });
};
