var progressBar = require("../progress-bar");
var readline    = require("readline-sync");
var semver      = require("semver");
var chalk       = require("chalk");
var child       = require("child_process");
var async       = require("async");
var fs          = require("fs");

exports.description = "";

exports.execute = function (config) {
  var changedPackages = [];
  var changedFiles = [config.versionLoc];

  var FORCE_VERSION = process.env.FORCE_VERSION;
  FORCE_VERSION = FORCE_VERSION ? FORCE_VERSION.split(",") : [];

  var NEW_VERSION = getVersion();
  fs.writeFileSync(config.versionLoc, NEW_VERSION, "utf8");

  //

  try {
    checkUpdatedPackages();
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

  function getPackageConfig(name) {
    return require(getPackageLocation(name) + "/package.json");
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

  function checkUpdatedPackages() {
    console.log("Checking packages...");

    var packageNames = fs.readdirSync(config.packagesLoc).filter(function (name) {
      return name[0] !== "." && fs.statSync(config.packagesLoc + "/" + name).isDirectory();
    });

    var tick = progressBar(packageNames.length);

    var lastTagCommit = execSync("git rev-list --tags --max-count=1");
    var lastTag       = execSync("git describe " + lastTagCommit);

    packageNames.forEach(function (name) {
      var config = getPackageConfig(name);
      tick(name);

      if (config.private) return;

      // check if package has changed since last release
      var diff = FORCE_VERSION.indexOf("*") >= 0 || FORCE_VERSION.indexOf(name) >= 0 ||
                 execSync("git diff " + lastTag + " -- " + getPackageLocation(name));
      if (diff) {
        changedPackages.push(name);
      }
    });

    if (!changedPackages.length && !FORCE_VERSION.length) {
      console.error(chalk.red("No updated packages to publish."));
      process.exit(1);
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
        var loc = getPackageLocation(name);
        while (true) {
          try {
            execSync("npm dist-tag rm " + name + " prerelease");
            execSync("npm dist-tag add " + name + "@" + NEW_VERSION + " stable");
            execSync("npm dist-tag add " + name + "@" + NEW_VERSION + " latest");
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
