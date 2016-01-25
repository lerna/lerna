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

function execSync(cmd) {
  return child.execSync(cmd, {
    encoding: "utf8"
  }).trim();
}

function getPackageLocation(packagesLoc, name) {
  return packagesLoc + "/" + name;
}

function gitAddTag(version) {
  var NEW_TAG_NAME = "v" + version;
  execSync("git commit -m " + NEW_TAG_NAME);
  execSync("git tag " + NEW_TAG_NAME);
}

function gitRemoveTag(version) {
  console.error(chalk.red("Attempting to roll back tag creation."));
  execSync("git tag -d v" + version);
}

function userGetVersion(currentVersion) {
  var input = readline.question("New version (Leave blank for patch version): ");

  var ver = semver.valid(input);

  if (!ver) {
    ver = semver.inc(currentVersion, input || "patch");
  }

  if (ver) {
    return ver;
  } else {
    console.log("Version provided is not valid semver.");
    return userGetVersion(currentVersion);
  }
}

function writeFile(loc, contents) {
  fs.writeFileSync(loc, contents, "utf8");
}

function gitAddFile(file) {
  execSync("git add " + file);
}

function gitAddFiles(files) {
  files.forEach(gitAddFile);
}

function updateDepsObject(deps, changedPackages, version) {
  for (var depName in deps) {
    // ensure this was generated and we're on the same major
    if (deps[depName][0] !== "^" || deps[depName][1] !== version[0]) continue;

    if (changedPackages.indexOf(depName) >= 0) {
      deps[depName] = "^" + version;
    }
  }
}

function updateChangedPackages(changedPackages, packagesLoc, version) {
  var changedFiles = [];

  changedPackages.forEach(function (name) {
    var pkgLoc = getPackageLocation(packagesLoc, name) + "/package.json";
    var pkg = require(pkgLoc);

    // set new version
    pkg.version = version;

    // updated dependencies
    updateDepsObject(pkg.dependencies, changedPackages, version);
    updateDepsObject(pkg.devDependencies, changedPackages, version);

    // write new package
    fs.writeFileSync(pkgLoc, JSON.stringify(pkg, null, "  ") + "\n");

    // push to be git committed
    changedFiles.push(pkgLoc);
  });

  gitAddFiles(changedFiles);
}

function execPrepublish(packagesLoc, package) {
  // prepublish script
  var prePub = getPackageLocation(packagesLoc, package) + "/scripts/prepublish.js";

  // Execute prepublish script if it exists
  if (fs.existsSync(prePub)) {
    require(prePub);
  }
}

function execPostPublish(packagesLoc, package) {
  // postpublish script
  var prePub = getPackageLocation(packagesLoc, package) + "/scripts/postpublish.js";

  // Execute postpublish script if it exists
  if (fs.existsSync(prePub)) {
    require(prePub);
  }
}

function npmPublishAsPrerelease(changedPackages, packagesLoc, callback) {
  changedPackages.forEach(function (package) {
    execPrepublish(packagesLoc, package);
  });

  console.log("Publishing tagged packages...");

  var tick = progressBar(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (package) {
    var retries = 0;

    return function run(done) {
      var loc = getPackageLocation(packagesLoc, package);

      child.exec("cd " + loc + " && npm publish --tag prerelease", function (err, stdout, stderr) {
        if (err || stderr) {
          err = stderr || err.stack;
          if (err.indexOf("You cannot publish over the previously published version") < 0) {
            if (++retries < 5) {
              console.log(chalk.yellow("Attempting to retry publishing " + package + "..."));
              return run(done);
            } else {
              console.log(chalk.red("Ran out of retries while publishing " + package));
              return done(err);
            }
          } else {
            // publishing over an existing package which is likely due to a timeout or something
            return done();
          }
        }

        tick(package);
        execPostPublish(packagesLoc, package);
        done();
      });
    };
  }), 4, callback);
}

function npmSetLatest(changedPackages, version, callback) {
  console.log("Setting latest npm tags...");

  var tick = progressBar(changedPackages.length);

  async.parallelLimit(changedPackages.map(function (package) {
    return function (done) {
      while (true) {
        try {
          execSync("npm dist-tag rm " + package + " prerelease");
          if (process.env.NPM_DIST_TAG) {
            execSync("npm dist-tag add " + package + "@" + version + " " + process.env.NPM_DIST_TAG);
          } else {
            execSync("npm dist-tag add " + package + "@" + version + " stable");
            execSync("npm dist-tag add " + package + "@" + version + " latest");
          }
          tick(package);
          break;
        } catch (err) {
          console.error(err.stack);
        }
      }
      done();
    };
  }), 4, callback);
}

exports.execute = function (config) {
  var changedPackages = [];
  var createdTag = false;

  var NEW_VERSION = userGetVersion(config.currentVersion);

  writeFile(config.versionLoc, NEW_VERSION, "utf8");
  gitAddFile(config.versionLoc);

  console.log(NEW_VERSION);

  try {
    // Find all changed packages to publish
    changedPackages = checkUpdatedPackages(config);

    // Log them to the console
    console.log("Packages to be updated");
    console.log(changedPackages.map(function (pkg) {
      return "- " + pkg;
    }).join("\n"));

    //
    updateChangedPackages(changedPackages, config.packagesLoc, NEW_VERSION);

    //
    gitAddTag(NEW_VERSION);
    createdTag = true;

    npmPublishAsPrerelease(changedPackages, config.packagesLoc, function (err) {
      if (err) return onError(err);

      npmSetLatest(changedPackages, NEW_VERSION, function (err) {
        if (err) return onError(err);
        execSync("git push");
        execSync("git push --tags");
        console.log();
        console.log(chalk.green("Successfully published " + NEW_VERSION + "."));
        process.exit();
      });
    });
  } catch (err) {
    onError(err);
  }

  function onError(err) {
    if (!err) return;

    console.log();
    console.error(chalk.red("There was a problem publishing."));
    if (createdTag) {
      gitRemoveTag();
    }
    console.error(err.stack || err);
    process.exit(1);
  }
};
