"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _signalExit = require("signal-exit");

var _signalExit2 = _interopRequireDefault(_signalExit);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _writePkg = require("write-pkg");

var _writePkg2 = _interopRequireDefault(_writePkg);

var _ChildProcessUtilities = require("./ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _FileSystemUtilities = require("./FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _splitVersion3 = require("./utils/splitVersion");

var _splitVersion4 = _interopRequireDefault(_splitVersion3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function execInstall(directory, _ref) {
  var registry = _ref.registry,
      npmClient = _ref.npmClient,
      npmClientArgs = _ref.npmClientArgs,
      npmGlobalStyle = _ref.npmGlobalStyle,
      mutex = _ref.mutex;

  // build command, arguments, and options
  var opts = NpmUtilities.getExecOpts(directory, registry);
  var args = ["install"];
  var cmd = npmClient || "npm";

  if (npmGlobalStyle) {
    cmd = "npm";
    args.push("--global-style");
  }

  if (cmd === "yarn" && mutex) {
    args.push("--mutex", mutex);
  }

  if (cmd === "yarn") {
    args.push("--non-interactive");
  }

  if (npmClientArgs && npmClientArgs.length) {
    args.push.apply(args, _toConsumableArray(npmClientArgs));
  }

  _npmlog2.default.silly("installInDir", [cmd, args]);
  return _ChildProcessUtilities2.default.exec(cmd, args, opts);
}

var NpmUtilities = function () {
  function NpmUtilities() {
    _classCallCheck(this, NpmUtilities);
  }

  _createClass(NpmUtilities, null, [{
    key: "installInDir",
    value: function installInDir(directory, dependencies, config, callback) {
      _npmlog2.default.silly("installInDir", _path2.default.basename(directory), dependencies);

      // Nothing to do if we weren't given any deps.
      if (!(dependencies && dependencies.length)) {
        _npmlog2.default.verbose("installInDir", "no dependencies to install");
        return callback();
      }

      var packageJson = _path2.default.join(directory, "package.json");
      var packageJsonBkp = packageJson + ".lerna_backup";

      _npmlog2.default.silly("installInDir", "backup", packageJson);
      _FileSystemUtilities2.default.rename(packageJson, packageJsonBkp, function (err) {
        if (err) {
          _npmlog2.default.error("installInDir", "problem backing up package.json", err);
          return callback(err);
        }

        var cleanup = function cleanup() {
          _npmlog2.default.silly("installInDir", "cleanup", packageJson);
          // Need to do this one synchronously because we might be doing it on exit.
          _FileSystemUtilities2.default.renameSync(packageJsonBkp, packageJson);
        };

        // If we die we need to be sure to put things back the way we found them.
        var unregister = (0, _signalExit2.default)(cleanup);

        // We have a few housekeeping tasks to take care of whether we succeed or fail.
        var done = function done(err) {
          cleanup();
          unregister();
          callback(err);
        };

        // Construct a basic fake package.json with just the deps we need to install.
        var tempJson = {
          dependencies: dependencies.reduce(function (deps, dep) {
            var _splitVersion = (0, _splitVersion4.default)(dep),
                _splitVersion2 = _slicedToArray(_splitVersion, 2),
                pkg = _splitVersion2[0],
                version = _splitVersion2[1];

            deps[pkg] = version || "*";
            return deps;
          }, {})
        };

        _npmlog2.default.silly("installInDir", "writing tempJson", tempJson);
        // Write out our temporary cooked up package.json and then install.
        (0, _writePkg2.default)(packageJson, tempJson).then(function () {
          return execInstall(directory, config);
        }).then(function () {
          return done();
        }, done);
      });
    }
  }, {
    key: "installInDirOriginalPackageJson",
    value: function installInDirOriginalPackageJson(directory, config, callback) {
      _npmlog2.default.silly("installInDirOriginalPackageJson", directory);

      return execInstall(directory, config).then(function () {
        return callback();
      }, callback);
    }
  }, {
    key: "addDistTag",
    value: function addDistTag(directory, packageName, version, tag, registry) {
      _npmlog2.default.silly("addDistTag", tag, version, packageName);

      var opts = NpmUtilities.getExecOpts(directory, registry);
      _ChildProcessUtilities2.default.execSync("npm", ["dist-tag", "add", `${packageName}@${version}`, tag], opts);
    }
  }, {
    key: "removeDistTag",
    value: function removeDistTag(directory, packageName, tag, registry) {
      _npmlog2.default.silly("removeDistTag", tag, packageName);

      var opts = NpmUtilities.getExecOpts(directory, registry);
      _ChildProcessUtilities2.default.execSync("npm", ["dist-tag", "rm", packageName, tag], opts);
    }
  }, {
    key: "checkDistTag",
    value: function checkDistTag(directory, packageName, tag, registry) {
      _npmlog2.default.silly("checkDistTag", tag, packageName);

      var opts = NpmUtilities.getExecOpts(directory, registry);
      return _ChildProcessUtilities2.default.execSync("npm", ["dist-tag", "ls", packageName], opts).indexOf(tag) >= 0;
    }
  }, {
    key: "runScriptInDir",
    value: function runScriptInDir(script, args, directory, callback) {
      _npmlog2.default.silly("runScriptInDir", script, args, _path2.default.basename(directory));

      var opts = NpmUtilities.getExecOpts(directory);
      _ChildProcessUtilities2.default.exec("npm", ["run", script].concat(_toConsumableArray(args)), opts, callback);
    }
  }, {
    key: "runScriptInDirSync",
    value: function runScriptInDirSync(script, args, directory, callback) {
      _npmlog2.default.silly("runScriptInDirSync", script, args, _path2.default.basename(directory));

      var opts = NpmUtilities.getExecOpts(directory);
      _ChildProcessUtilities2.default.execSync("npm", ["run", script].concat(_toConsumableArray(args)), opts, callback);
    }
  }, {
    key: "runScriptInPackageStreaming",
    value: function runScriptInPackageStreaming(script, args, pkg, callback) {
      _npmlog2.default.silly("runScriptInPackageStreaming", [script, args, pkg.name]);

      var opts = NpmUtilities.getExecOpts(pkg.location);
      _ChildProcessUtilities2.default.spawnStreaming("npm", ["run", script].concat(_toConsumableArray(args)), opts, pkg.name, callback);
    }
  }, {
    key: "publishTaggedInDir",
    value: function publishTaggedInDir(tag, directory, registry, callback) {
      _npmlog2.default.silly("publishTaggedInDir", tag, _path2.default.basename(directory));

      var opts = NpmUtilities.getExecOpts(directory, registry);
      _ChildProcessUtilities2.default.exec("npm", ["publish", "--tag", tag.trim()], opts, callback);
    }
  }, {
    key: "getExecOpts",
    value: function getExecOpts(directory, registry) {
      var opts = {
        cwd: directory
      };

      if (registry) {
        opts.env = Object.assign({}, process.env, {
          npm_config_registry: registry
        });
      }

      _npmlog2.default.silly("getExecOpts", opts);
      return opts;
    }
  }]);

  return NpmUtilities;
}();

exports.default = NpmUtilities;
module.exports = exports["default"];