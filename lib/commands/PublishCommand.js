"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.handler = handler;

var _os = require("os");

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _minimatch = require("minimatch");

var _minimatch2 = _interopRequireDefault(_minimatch);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _writeJsonFile = require("write-json-file");

var _writeJsonFile2 = _interopRequireDefault(_writeJsonFile);

var _writePkg = require("write-pkg");

var _writePkg2 = _interopRequireDefault(_writePkg);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _ConventionalCommitUtilities = require("../ConventionalCommitUtilities");

var _ConventionalCommitUtilities2 = _interopRequireDefault(_ConventionalCommitUtilities);

var _FileSystemUtilities = require("../FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _GitUtilities = require("../GitUtilities");

var _GitUtilities2 = _interopRequireDefault(_GitUtilities);

var _NpmUtilities = require("../NpmUtilities");

var _NpmUtilities2 = _interopRequireDefault(_NpmUtilities);

var _output = require("../utils/output");

var _output2 = _interopRequireDefault(_output);

var _PackageUtilities = require("../PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

var _PromptUtilities = require("../PromptUtilities");

var _PromptUtilities2 = _interopRequireDefault(_PromptUtilities);

var _UpdatedPackagesCollector = require("../UpdatedPackagesCollector");

var _UpdatedPackagesCollector2 = _interopRequireDefault(_UpdatedPackagesCollector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new PublishCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "publish";

var describe = exports.describe = "Publish packages in the current project.";

var cdVersionOptions = ["major", "minor", "patch", "premajor", "preminor", "prepatch", "prerelease"];

var cdVersionOptionString = `'${cdVersionOptions.slice(0, -1).join("', '")}', or '${cdVersionOptions[cdVersionOptions.length - 1]}'.`;

var builder = exports.builder = {
  "canary": {
    group: "Command Options:",
    defaultDescription: "alpha",
    describe: "Publish packages after every successful merge using the sha as part of the tag.",
    alias: "c"
    // NOTE: this type must remain undefined, as it is too overloaded to make sense
    // type: "string",
  },
  "cd-version": {
    group: "Command Options:",
    describe: `Skip the version selection prompt and increment semver: ${cdVersionOptionString}`,
    type: "string",
    requiresArg: true,
    coerce: function coerce(choice) {
      if (cdVersionOptions.indexOf(choice) === -1) {
        throw new Error(`--cd-version must be one of: ${cdVersionOptionString}`);
      }
      return choice;
    }
  },
  "conventional-commits": {
    group: "Command Options:",
    describe: "Use angular conventional-commit format to determine version bump and generate CHANGELOG.",
    type: "boolean",
    default: undefined
  },
  "exact": {
    group: "Command Options:",
    describe: "Specify cross-dependency version numbers exactly rather than with a caret (^).",
    type: "boolean",
    default: undefined
  },
  "git-remote": {
    group: "Command Options:",
    defaultDescription: "origin",
    describe: "Push git changes to the specified remote instead of 'origin'.",
    type: "string",
    requiresArg: true
  },
  "yes": {
    group: "Command Options:",
    describe: "Skip all confirmation prompts.",
    type: "boolean",
    default: undefined
  },
  "message": {
    group: "Command Options:",
    describe: "Use a custom commit message when creating the publish commit.",
    alias: "m",
    type: "string",
    requiresArg: true
  },
  "npm-tag": {
    group: "Command Options:",
    describe: "Publish packages with the specified npm dist-tag",
    type: "string",
    requiresArg: true
  },
  "preid": {
    group: "Command Options:",
    describe: "Specify the prerelease identifier (major.minor.patch-pre).",
    type: "string",
    requiresArg: true
  },
  "repo-version": {
    group: "Command Options:",
    describe: "Specify repo version to publish.",
    type: "string",
    requiresArg: true
  },
  "skip-git": {
    group: "Command Options:",
    describe: "Skip commiting, tagging, and pushing git changes.",
    type: "boolean",
    default: undefined
  },
  "skip-npm": {
    group: "Command Options:",
    describe: "Stop before actually publishing change to npm.",
    type: "boolean",
    default: undefined
  },
  "temp-tag": {
    group: "Command Options:",
    describe: "Create a temporary tag while publishing.",
    type: "boolean",
    default: undefined
  },
  "allow-branch": {
    group: "Command Options:",
    describe: "Specify which branches to allow publishing from.",
    type: "string",
    default: undefined
  }
};

var PublishCommand = function (_Command) {
  _inherits(PublishCommand, _Command);

  function PublishCommand() {
    _classCallCheck(this, PublishCommand);

    return _possibleConstructorReturn(this, (PublishCommand.__proto__ || Object.getPrototypeOf(PublishCommand)).apply(this, arguments));
  }

  _createClass(PublishCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var _this2 = this;

      this.gitRemote = this.options.gitRemote || "origin";
      this.gitEnabled = !(this.options.canary || this.options.skipGit);

      if (this.options.useGitVersion && !this.options.exact) {
        throw new Error(_dedent2.default`
        Using git version without 'exact' option is not recommended.
        Please make sure you publish with --exact.
      `);
      }

      if (this.options.canary) {
        this.logger.info("canary", "enabled");
      }

      if (!this.repository.isIndependent()) {
        this.globalVersion = this.repository.version;
        this.logger.info("current version", this.globalVersion);
      }

      // git validation, if enabled, should happen before updates are calculated and versions picked
      if (this.gitEnabled) {
        if (_GitUtilities2.default.isDetachedHead(this.execOpts)) {
          throw new _Command2.ValidationError("ENOGIT", "Detached git HEAD, please checkout a branch to publish changes.");
        }

        var currentBranch = _GitUtilities2.default.getCurrentBranch(this.execOpts);
        if (this.options.allowBranch && !(0, _minimatch2.default)(currentBranch, this.options.allowBranch)) {
          throw new _Command2.ValidationError("ENOTALLOWED", _dedent2.default`
            Branch '${currentBranch}' is restricted from publishing due to allowBranch config.
            Please consider the reasons for this restriction before overriding the option.
          `);
        }
      }

      this.updates = new _UpdatedPackagesCollector2.default(this).getUpdates();

      this.packagesToPublish = this.updates.map(function (update) {
        return update.package;
      }).filter(function (pkg) {
        return !pkg.isPrivate();
      });

      this.packagesToPublishCount = this.packagesToPublish.length;
      try {
        this.batchedPackagesToPublish = this.toposort ? _PackageUtilities2.default.topologicallyBatchPackages(this.packagesToPublish, {
          // Don't sort based on devDependencies because that would increase the chance of dependency cycles
          // causing less-than-ideal a publishing order.
          depsOnly: true,
          rejectCycles: this.options.rejectCycles
        }) : [this.packagesToPublish];
      } catch (e) {
        return callback(e);
      }

      if (!this.updates.length) {
        this.logger.info("No updated packages to publish.");
        callback(null, false);
        return;
      }

      this.getVersionsForUpdates(function (err, results) {
        if (err) {
          callback(err);
          return;
        }

        var version = results.version;
        var versions = results.versions;

        if (!versions) {
          versions = {};
          _this2.updates.forEach(function (update) {
            versions[update.package.name] = version;
          });
        }

        _this2.masterVersion = version;
        _this2.updatesVersions = versions;

        _this2.confirmVersions(callback);
      });
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      if (!this.repository.isIndependent() && !this.options.canary) {
        this.updateVersionInLernaJson();
      }

      this.updateUpdatedPackages();

      if (this.gitEnabled) {
        this.commitAndTagUpdates();
      }

      if (this.options.skipNpm) {
        callback(null, true);
      } else {
        this.publishPackagesToNpm(callback);
      }
    }
  }, {
    key: "publishPackagesToNpm",
    value: function publishPackagesToNpm(callback) {
      var _this3 = this;

      this.logger.info("publish", "Publishing packages to npm...");

      this.npmPublish(function (err) {
        if (err) {
          callback(err);
          return;
        }

        if (_this3.options.canary) {
          _this3.logger.info("canary", "Resetting git state");
          // reset since the package.json files are changed
          _this3.repository.packageParentDirs.forEach(function (packageDir) {
            _GitUtilities2.default.checkoutChanges(`${packageDir}/*/package.json`, _this3.execOpts);
          });
        }

        _this3.npmUpdateAsLatest(function (err) {
          if (err) {
            callback(err);
            return;
          }

          if (_this3.gitEnabled) {
            _this3.logger.info("git", "Pushing tags...");
            _GitUtilities2.default.pushWithTags(_this3.gitRemote, _this3.tags, _this3.execOpts);
          }

          var message = _this3.packagesToPublish.map(function (pkg) {
            return ` - ${pkg.name}@${pkg.version}`;
          });

          (0, _output2.default)("Successfully published:");
          (0, _output2.default)(message.join(_os.EOL));

          _this3.logger.success("publish", "finished");
          callback(null, true);
        });
      });
    }
  }, {
    key: "getVersionsForUpdates",
    value: function getVersionsForUpdates(callback) {
      var _this4 = this;

      var cdVersion = this.options.cdVersion;
      if (cdVersion && !this.options.canary) {
        // If the version is independent then send versions
        if (this.repository.isIndependent()) {
          var versions = {};

          this.updates.forEach(function (update) {
            versions[update.package.name] = _semver2.default.inc(update.package.version, cdVersion, _this4.options.preid);
          });

          return callback(null, { versions });
        }

        // Otherwise bump the global version
        var version = _semver2.default.inc(this.globalVersion, cdVersion, this.options.preid);
        return callback(null, { version });
      }

      if (this.options.repoVersion) {
        return callback(null, {
          version: this.options.repoVersion
        });
      }

      if (this.options.canary) {
        if (this.repository.isIndependent()) {
          // Independent Canary Mode
          var _versions = {};
          this.updates.forEach(function (update) {
            _versions[update.package.name] = _this4.getCanaryVersion(update.package.version, _this4.options.canary);
          });

          return callback(null, { versions: _versions });
        } else {
          // Non-Independent Canary Mode
          var _version = this.getCanaryVersion(this.globalVersion, this.options.canary);
          return callback(null, { version: _version });
        }
      }

      if (this.options.conventionalCommits) {
        if (this.repository.isIndependent()) {
          // Independent Conventional-Commits Mode
          var _versions2 = {};
          this.recommendVersions(this.updates, _ConventionalCommitUtilities2.default.recommendIndependentVersion, function (versionBump) {
            _versions2[versionBump.pkg.name] = versionBump.recommendedVersion;
          });

          return callback(null, { versions: _versions2 });
        } else {
          // Non-Independent Conventional-Commits Mode
          var currentFixedVersion = this.repository.lernaJson.version;

          this.updates.forEach(function (update) {
            var pkg = update.package;
            if (_semver2.default.lt(pkg.version, currentFixedVersion)) {
              _this4.logger.verbose("publish", `Overriding version of ${pkg.name} from  ${pkg.version} to ${currentFixedVersion}`);
              pkg.version = currentFixedVersion;
            }
          });

          var _version2 = "0.0.0";
          this.recommendVersions(this.updates, _ConventionalCommitUtilities2.default.recommendFixedVersion, function (versionBump) {
            if (_semver2.default.gt(versionBump.recommendedVersion, _version2)) {
              _version2 = versionBump.recommendedVersion;
            }
          });
          return callback(null, { version: _version2 });
        }
      }

      if (this.repository.isIndependent()) {
        // Independent Non-Canary Mode
        _async2.default.mapLimit(this.updates, 1, function (update, cb) {
          _this4.promptVersion(update.package.name, update.package.version, cb);
        }, function (err, versions) {
          if (err) {
            return callback(err);
          }

          _this4.updates.forEach(function (update, index) {
            versions[update.package.name] = versions[index];
          });

          return callback(null, { versions });
        });
      } else {
        // Non-Independent Non-Canary Mode
        this.promptVersion(null, this.globalVersion, function (err, version) {
          if (err) {
            return callback(err);
          } else {
            return callback(null, { version });
          }
        });
      }
    }
  }, {
    key: "recommendVersions",
    value: function recommendVersions(updates, recommendVersionFn, callback) {
      var _this5 = this;

      updates.forEach(function (update) {
        var pkg = {
          name: update.package.name,
          version: update.package.version,
          location: update.package.location
        };
        var recommendedVersion = recommendVersionFn(pkg, _this5.execOpts);
        callback({ pkg, recommendedVersion });
      });
    }
  }, {
    key: "getCanaryVersion",
    value: function getCanaryVersion(version, preid) {
      if (preid == null || typeof preid !== "string") {
        preid = "alpha";
      }

      var release = this.options.cdVersion || "minor";
      var nextVersion = _semver2.default.inc(version, release);
      var hash = _GitUtilities2.default.getCurrentSHA(this.execOpts).slice(0, 8);
      return `${nextVersion}-${preid}.${hash}`;
    }
  }, {
    key: "promptVersion",
    value: function promptVersion(packageName, currentVersion, callback) {
      var patch = _semver2.default.inc(currentVersion, "patch");
      var minor = _semver2.default.inc(currentVersion, "minor");
      var major = _semver2.default.inc(currentVersion, "major");
      var prepatch = _semver2.default.inc(currentVersion, "prepatch");
      var preminor = _semver2.default.inc(currentVersion, "preminor");
      var premajor = _semver2.default.inc(currentVersion, "premajor");

      var message = "Select a new version";
      if (packageName) message += ` for ${packageName}`;
      message += ` (currently ${currentVersion})`;

      _PromptUtilities2.default.select(message, {
        choices: [{ value: patch, name: `Patch (${patch})` }, { value: minor, name: `Minor (${minor})` }, { value: major, name: `Major (${major})` }, { value: prepatch, name: `Prepatch (${prepatch})` }, { value: preminor, name: `Preminor (${preminor})` }, { value: premajor, name: `Premajor (${premajor})` }, { value: "PRERELEASE", name: "Prerelease" }, { value: "CUSTOM", name: "Custom" }]
      }, function (choice) {
        switch (choice) {

          case "CUSTOM":
            {
              _PromptUtilities2.default.input("Enter a custom version", {
                filter: _semver2.default.valid,
                validate: function validate(v) {
                  return v !== null || "Must be a valid semver version";
                }
              }, function (input) {
                callback(null, input);
              });
              break;
            }

          case "PRERELEASE":
            {
              var components = _semver2.default.prerelease(currentVersion);
              var existingId = null;
              if (components && components.length === 2) {
                existingId = components[0];
              }
              var defaultVersion = _semver2.default.inc(currentVersion, "prerelease", existingId);
              var prompt = `(default: ${existingId ? `"${existingId}"` : "none"}, yielding ${defaultVersion})`;

              // TODO: allow specifying prerelease identifier as CLI option to skip the prompt
              _PromptUtilities2.default.input(`Enter a prerelease identifier ${prompt}`, {
                filter: function filter(v) {
                  var preid = v || existingId;
                  return _semver2.default.inc(currentVersion, "prerelease", preid);
                }
              }, function (input) {
                callback(null, input);
              });
              break;
            }

          default:
            {
              callback(null, choice);
              break;
            }

        }
      });
    }
  }, {
    key: "confirmVersions",
    value: function confirmVersions(callback) {
      var _this6 = this;

      var changes = this.updates.map(function (update) {
        var pkg = update.package;
        var line = ` - ${pkg.name}: ${pkg.version} => ${_this6.updatesVersions[pkg.name]}`;
        if (pkg.isPrivate()) {
          line += ` (${_chalk2.default.red("private")})`;
        }
        return line;
      });

      (0, _output2.default)("");
      (0, _output2.default)("Changes:");
      (0, _output2.default)(changes.join(_os.EOL));
      (0, _output2.default)("");

      if (this.options.yes) {
        this.logger.info("auto-confirmed");
        callback(null, true);
      } else {
        _PromptUtilities2.default.confirm("Are you sure you want to publish the above changes?", function (confirm) {
          callback(null, confirm);
        });
      }
    }
  }, {
    key: "updateVersionInLernaJson",
    value: function updateVersionInLernaJson() {
      this.repository.lernaJson.version = this.masterVersion;
      _writeJsonFile2.default.sync(this.repository.lernaJsonLocation, this.repository.lernaJson, { indent: 2 });

      if (!this.options.skipGit) {
        _GitUtilities2.default.addFile(this.repository.lernaJsonLocation, this.execOpts);
      }
    }
  }, {
    key: "runSyncScriptInPackage",
    value: function runSyncScriptInPackage(pkg, scriptName) {
      var _this7 = this;

      pkg.runScriptSync(scriptName, function (err) {
        if (err) {
          _this7.logger.error("publish", `error running ${scriptName} in ${pkg.name}\n`, err.stack || err);
        }
      });
    }
  }, {
    key: "updateUpdatedPackages",
    value: function updateUpdatedPackages() {
      var _this8 = this;

      var exact = this.options.exact;

      var changedFiles = [];

      this.updates.forEach(function (update) {
        var pkg = update.package;
        var packageLocation = pkg.location;
        var packageJsonLocation = _path2.default.join(packageLocation, "package.json");

        // set new version
        pkg.version = _this8.updatesVersions[pkg.name] || pkg.version;

        // update pkg dependencies
        _this8.updatePackageDepsObject(pkg, "dependencies", exact);
        _this8.updatePackageDepsObject(pkg, "devDependencies", exact);
        _this8.updatePackageDepsObject(pkg, "peerDependencies", exact);

        // exec preversion script
        _this8.runSyncScriptInPackage(pkg, "preversion");

        // write new package
        _writePkg2.default.sync(packageJsonLocation, pkg.toJSON());
        // NOTE: Object.prototype.toJSON() is normally called when passed to
        // JSON.stringify(), but write-pkg iterates Object.keys() before serializing
        // so it has to be explicit here (otherwise it mangles the instance properties)

        // exec version script
        _this8.runSyncScriptInPackage(pkg, "version");

        // we can now generate the Changelog, based on the
        // the updated version that we're about to release.
        if (_this8.options.conventionalCommits) {
          if (_this8.repository.isIndependent()) {
            _ConventionalCommitUtilities2.default.updateIndependentChangelog({
              name: pkg.name,
              location: pkg.location
            }, _this8.execOpts);
          } else {

            _ConventionalCommitUtilities2.default.updateFixedChangelog({
              name: pkg.name,
              location: pkg.location
            }, _this8.execOpts);
          }

          changedFiles.push(_ConventionalCommitUtilities2.default.changelogLocation(pkg));
        }

        // push to be git committed
        changedFiles.push(packageJsonLocation);
      });

      if (this.options.conventionalCommits) {
        if (!this.repository.isIndependent()) {
          var packageJson = this.repository.packageJson;

          _ConventionalCommitUtilities2.default.updateFixedRootChangelog({
            name: packageJson && packageJson.name ? packageJson.name : 'root',
            location: this.repository.rootPath
          }, this.execOpts);

          changedFiles.push(_ConventionalCommitUtilities2.default.changelogLocation({
            location: this.repository.rootPath
          }));
        }
      }

      if (this.gitEnabled) {
        changedFiles.forEach(function (file) {
          return _GitUtilities2.default.addFile(file, _this8.execOpts);
        });
      }
    }
  }, {
    key: "updatePackageDepsObject",
    value: function updatePackageDepsObject(pkg, depsKey, exact) {
      var _this9 = this;

      var deps = pkg[depsKey];

      if (!deps) {
        return;
      }

      this.packageGraph.get(pkg.name).dependencies.forEach(function (depName) {
        var version = _this9.updatesVersions[depName];

        if (deps[depName] && version) {
          deps[depName] = exact ? version : "^" + version;
        }
      });
    }
  }, {
    key: "commitAndTagUpdates",
    value: function commitAndTagUpdates() {
      var _this10 = this;

      if (this.repository.isIndependent()) {
        this.tags = this.gitCommitAndTagVersionForUpdates();
      } else {
        this.tags = [this.gitCommitAndTagVersion(this.masterVersion)];
      }

      // run the postversion script for each update
      this.updates.forEach(function (update) {
        _this10.runSyncScriptInPackage(update.package, "postversion");
      });
    }
  }, {
    key: "gitCommitAndTagVersionForUpdates",
    value: function gitCommitAndTagVersionForUpdates() {
      var _this11 = this;

      var tags = this.updates.map(function (_ref) {
        var name = _ref["package"].name;
        return `${name}@${_this11.updatesVersions[name]}`;
      });
      var subject = this.options.message || "Publish";
      var message = tags.reduce(function (msg, tag) {
        return msg + `${_os.EOL} - ${tag}`;
      }, `${subject}${_os.EOL}`);

      _GitUtilities2.default.commit(message, this.execOpts);
      tags.forEach(function (tag) {
        return _GitUtilities2.default.addTag(tag, _this11.execOpts);
      });

      return tags;
    }
  }, {
    key: "gitCommitAndTagVersion",
    value: function gitCommitAndTagVersion(version) {
      var tag = "v" + version;
      var message = this.options.message && this.options.message.replace(/%s/g, tag) || tag;

      _GitUtilities2.default.commit(message, this.execOpts);
      _GitUtilities2.default.addTag(tag, this.execOpts);

      return tag;
    }
  }, {
    key: "execScript",
    value: function execScript(pkg, script) {
      var scriptLocation = _path2.default.join(pkg.location, "scripts", script + ".js");

      if (_FileSystemUtilities2.default.existsSync(scriptLocation)) {
        require(scriptLocation);
      } else {
        this.logger.verbose("execScript", `No ${script} script found at ${scriptLocation}`);
      }
    }
  }, {
    key: "npmPublish",
    value: function npmPublish(callback) {
      var _this12 = this;

      var tracker = this.logger.newItem("npmPublish");

      // if we skip temp tags we should tag with the proper value immediately
      // therefore no updates will be needed
      var tag = this.options.tempTag ? "lerna-temp" : this.getDistTag();

      this.updates.forEach(function (update) {
        _this12.execScript(update.package, "prepublish");
      });

      tracker.addWork(this.packagesToPublishCount);

      _PackageUtilities2.default.runParallelBatches(this.batchedPackagesToPublish, function (pkg) {
        var attempts = 0;

        var run = function run(cb) {
          tracker.verbose("publishing", pkg.name);

          _NpmUtilities2.default.publishTaggedInDir(tag, pkg.location, _this12.npmRegistry, function (err) {
            err = err && err.stack || err;

            if (!err ||
            // publishing over an existing package which is likely due to a timeout or something
            err.indexOf("You cannot publish over the previously published version") > -1) {
              tracker.info("published", pkg.name);
              tracker.completeWork(1);
              _this12.execScript(pkg, "postpublish");
              cb();
              return;
            }

            attempts++;

            if (attempts < 5) {
              _this12.logger.error("publish", "Retrying failed publish:", pkg.name);
              _this12.logger.verbose("publish error", err.message);
              run(cb);
            } else {
              _this12.logger.error("publish", "Ran out of retries while publishing", pkg.name, err.stack || err);
              cb(err);
            }
          });
        };

        return run;
      }, this.concurrency, function (err) {
        tracker.finish();
        callback(err);
      });
    }
  }, {
    key: "npmUpdateAsLatest",
    value: function npmUpdateAsLatest(callback) {
      var _this13 = this;

      if (!this.options.tempTag) {
        return callback();
      }

      var tracker = this.logger.newItem("npmUpdateAsLatest");
      tracker.addWork(this.packagesToPublishCount);

      _PackageUtilities2.default.runParallelBatches(this.batchedPackagesToPublish, function (pkg) {
        return function (cb) {
          var attempts = 0;

          while (true) {
            attempts++;

            try {
              _this13.updateTag(pkg);
              tracker.info("latest", pkg.name);
              tracker.completeWork(1);
              cb();
              break;
            } catch (err) {
              if (attempts < 5) {
                _this13.logger.error("publish", "Error updating version as latest", err.stack || err);
                continue;
              } else {
                cb(err);
                return;
              }
            }
          }
        };
      }, 4, function (err) {
        tracker.finish();
        callback(err);
      });
    }
  }, {
    key: "updateTag",
    value: function updateTag(pkg) {
      var distTag = this.getDistTag();

      if (_NpmUtilities2.default.checkDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry)) {
        _NpmUtilities2.default.removeDistTag(pkg.location, pkg.name, "lerna-temp", this.npmRegistry);
      }

      /* eslint-disable max-len */
      // TODO: fix this API to be less verbose with parameters
      if (this.options.npmTag) {
        _NpmUtilities2.default.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
      } else if (this.options.canary) {
        _NpmUtilities2.default.addDistTag(pkg.location, pkg.name, pkg.version, distTag, this.npmRegistry);
      } else {
        _NpmUtilities2.default.addDistTag(pkg.location, pkg.name, this.updatesVersions[pkg.name], distTag, this.npmRegistry);
      }
      /* eslint-enable max-len */
    }
  }, {
    key: "getDistTag",
    value: function getDistTag() {
      return this.options.npmTag || this.options.canary && "canary" || "latest";
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return Object.assign({}, _get(PublishCommand.prototype.__proto__ || Object.getPrototypeOf(PublishCommand.prototype), "defaultOptions", this), {
        conventionalCommits: false,
        exact: false,
        skipGit: false,
        skipNpm: false,
        tempTag: false,
        yes: false,
        allowBranch: false
      });
    }
  }]);

  return PublishCommand;
}(_Command3.default);

exports.default = PublishCommand;