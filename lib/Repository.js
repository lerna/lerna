"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _findUp = require("find-up");

var _findUp2 = _interopRequireDefault(_findUp);

var _globParent = require("glob-parent");

var _globParent2 = _interopRequireDefault(_globParent);

var _loadJsonFile = require("load-json-file");

var _loadJsonFile2 = _interopRequireDefault(_loadJsonFile);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _readPkg = require("read-pkg");

var _readPkg2 = _interopRequireDefault(_readPkg);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _dependencyIsSatisfied = require("./utils/dependencyIsSatisfied");

var _dependencyIsSatisfied2 = _interopRequireDefault(_dependencyIsSatisfied);

var _Package = require("./Package");

var _Package2 = _interopRequireDefault(_Package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_PACKAGE_GLOB = "packages/*";

var Repository = function () {
  function Repository(cwd) {
    _classCallCheck(this, Repository);

    var lernaJsonLocation =
    // findUp returns null when not found
    _findUp2.default.sync("lerna.json", { cwd }) ||

    // path.resolve(".", ...) starts from process.cwd()
    _path2.default.resolve(cwd || ".", "lerna.json");

    this.rootPath = _path2.default.dirname(lernaJsonLocation);
    _npmlog2.default.verbose("rootPath", this.rootPath);

    this.lernaJsonLocation = lernaJsonLocation;
    this.packageJsonLocation = _path2.default.join(this.rootPath, "package.json");
  }

  _createClass(Repository, [{
    key: "isCompatibleLerna",
    value: function isCompatibleLerna(cliVersion) {
      return _semver2.default.satisfies(cliVersion, `^${this.initVersion}`);
    }
  }, {
    key: "isIndependent",
    value: function isIndependent() {
      return this.version === "independent";
    }
  }, {
    key: "hasDependencyInstalled",
    value: function hasDependencyInstalled(depName, version) {
      _npmlog2.default.silly("hasDependencyInstalled", "ROOT", depName, version);

      return (0, _dependencyIsSatisfied2.default)(this.nodeModulesLocation, depName, version);
    }
  }, {
    key: "lernaJson",
    get: function get() {
      if (!this._lernaJson) {
        try {
          this._lernaJson = _loadJsonFile2.default.sync(this.lernaJsonLocation);
        } catch (ex) {
          // No need to distinguish between missing and empty,
          // saves a lot of noisy guards elsewhere
          this._lernaJson = {};
        }
      }

      return this._lernaJson;
    }
  }, {
    key: "initVersion",
    get: function get() {
      return this.lernaJson.lerna;
    }
  }, {
    key: "version",
    get: function get() {
      return this.lernaJson.version;
    }
  }, {
    key: "nodeModulesLocation",
    get: function get() {
      return _path2.default.join(this.rootPath, "node_modules");
    }
  }, {
    key: "packageConfigs",
    get: function get() {
      if (this.lernaJson.useWorkspaces) {
        return this.packageJson.workspaces;
      }
      return this.lernaJson.packages || [DEFAULT_PACKAGE_GLOB];
    }
  }, {
    key: "packageParentDirs",
    get: function get() {
      var _this = this;

      return this.packageConfigs.map(_globParent2.default).map(function (parentDir) {
        return _path2.default.resolve(_this.rootPath, parentDir);
      });
    }
  }, {
    key: "packageJson",
    get: function get() {
      if (!this._packageJson) {
        try {
          this._packageJson = _readPkg2.default.sync(this.packageJsonLocation, { normalize: false });
        } catch (ex) {
          // try again next time
          this._packageJson = null;
        }
      }

      return this._packageJson;
    }
  }, {
    key: "package",
    get: function get() {
      if (!this._package) {
        this._package = new _Package2.default(this.packageJson, this.rootPath);
      }

      return this._package;
    }

    // Legacy

  }, {
    key: "versionLocation",
    get: function get() {
      return _path2.default.join(this.rootPath, "VERSION");
    }
  }]);

  return Repository;
}();

exports.default = Repository;
module.exports = exports["default"];