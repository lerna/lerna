var progressBar = require("../progress-bar");
var updated     = require("./updated");
var readline    = require("readline-sync");
var semver      = require("semver");
var chalk       = require("chalk");
var child       = require("child_process");
var async       = require("async");
var fs          = require("fs");

var checkUpdatedPackages = updated.checkUpdatedPackages;

exports.description = "Publish updated packages to npm";

exports.execute = function (config) {
  var changedPackages = [];
  var changedFiles = [config.versionLoc];

  var FORCE_VERSION = process.env.FORCE_VERSION;
  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  var NEW_VERSION = getVersion();
  fs.writeFileSync(config.versionLoc, NEW_VERSION, "utf8");

  //

  try {
    changedPackages = checkUpdatedPackages(config);
    console.log("Packages to be updated");
    console.log(changedPackages.map(function(pkg) {
      return "- " + pkg;
    }).join("\n"));
    updateChangedPackages();
    updateTag();
    publish();
  } catch (err) {
    onError(err);
  }

  //

  var createdTag = false;

  function updateTag() {
    var NEW_TAG_NAME = "v" + NEW_VERSION;
    execSync("git commit -m " + NEW_TAG_NAME);
    execSync("git tag " + NEW_TAG_NAME);
    createdTag = true;
  }

  function removeTag() {
    if (createdTag) {
      console.error(chalk.red("Attempting to roll back tag creation."));
      execSync("git tag -d v" + NEW_VERSION);
    }
  }

  function getVersion() {
    var input = readline.question("New version (Leave blank for patch version): ");

    var ver = semver.valid(input);
    if (!ver) {
      ver = semver.inc(config.currentVersion, input || "patch");
    }

    if (ver) {
      return ver;
    } else {
      console.log("Version provided is not valid semver.");
      return getVersion();
    }
  }

  function execSync(cmd) {
    return child.execSync(cmd, {
      encoding: "utf8"
    }).trim();
  }

  function getPackageLocation(name) {
    return config.packagesLoc + "/" + name;
  }

  function updateDepsObject(deps) {
    for (var depName in deps) {
      // ensure this was generated and we're on the same major
      if (deps[depName][0] !== "^" || deps[depName][1] !== NEW_VERSION[0]) continue;

      if (changedPackages.indexOf(depName) >= 0) {
        deps[depName] = "^" + NEW_VERSION;
      }
    }
  }

  function updateChangedPackages() {
    changedPackages.forEach(function (name) {
      var pkgLoc = getPackageLocation(name) + "/package.json";
      var pkg = require(pkgLoc);

      // set new version
      pkg.version = NEW_VERSION;

      // updated dependencies
      updateDepsObject(pkg.dependencies);
      updateDepsObject(pkg.devDependencies);

      // write new package
      fs.writeFileSync(pkgLoc, JSON.stringify(pkg, null, "  ") + "\n");

      // push to be git committed
      changedFiles.push(pkgLoc);
    });

    changedFiles.forEach(function (loc) {
      execSync("git add " + loc);
    });
  }

  function publish() {
    changedPackages.forEach(function (name) {
      // prepublish script
      var prePub = getPackageLocation(name) + "/scripts/prepublish.js";
      if (fs.existsSync(prePub)) require(prePub);
    });

    console.log("Publishing tagged packages...");
    var tick = progressBar(changedPackages.length);

    async.parallelLimit(changedPackages.map(function (name) {
      var retries = 0;

      return function run(done) {
        var loc = getPackageLocation(name);

        child.exec("cd " + loc + " && npm publish --tag prerelease", function (err, stdout, stderr) {
          if (err || stderr) {
            err = stderr || err.stack;
            if (err.indexOf("You cannot publish over the previously published version") < 0) {
              if (++retries < 5) {
                console.log(chalk.yellow("Attempting to retry publishing " + name + "..."));
                return run(done);
              } else {
                console.log(chalk.red("Ran out of retries while publishing " + name));
                return done(err);
              }
            } else {
              // publishing over an existing package which is likely due to a timeout or something
              return done();
            }
          }

          tick(name);

          // postpublish script
          var postPub = loc + "/scripts/postpublish.js";
          if (fs.existsSync(postPub)) require(postPub);

          done();
        });
      };
    }), 4, function (err) {
      onError(err);
      ship();
    });
  }

  function onError(err) {
    if (!err) return;

    console.log();
    console.error(chalk.red("There was a problem publishing."));
    removeTag();
    console.error(err.stack || err);
    process.exit(1);
  }

  function ship() {
    console.log("Setting latest npm tags...");
    var tick = progressBar(changedPackages.length);

    async.parallelLimit(changedPackages.map(function (name) {
      return function (done) {
        while (true) {
          try {
            execSync("npm dist-tag rm " + name + " prerelease");
            if (process.env.NPM_DIST_TAG) {
              execSync("npm dist-tag add " + name + "@" + NEW_VERSION + " " + process.env.NPM_DIST_TAG);
            } else {
              execSync("npm dist-tag add " + name + "@" + NEW_VERSION + " latest");
            }
            tick(name);
            break;
          } catch (err) {
            console.error(err.stack);
          }
        }
        done();
      };
    }), 4, function (err) {
      onError(err);
      execSync("git push");
      execSync("git push --tags");
      console.log();
      console.log(chalk.green("Successfully published " + NEW_VERSION + "."));
      process.exit();
    });
  }
};
