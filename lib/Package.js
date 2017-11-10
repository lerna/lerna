"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _dependencyIsSatisfied = require("./utils/dependencyIsSatisfied");

var _dependencyIsSatisfied2 = _interopRequireDefault(_dependencyIsSatisfied);

var _NpmUtilities = require("./NpmUtilities");

var _NpmUtilities2 = _interopRequireDefault(_NpmUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Package = function () {
  function Package(pkg, location) {
    _classCallCheck(this, Package);

    this._package = pkg;
    this._location = location;
  }

  _createClass(Package, [{
    key: "isPrivate",
    value: function isPrivate() {
      return !!this._package.private;
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      var pkg = _lodash2.default.cloneDeep(this._package);
      return this._versionSerializer ? this._versionSerializer.serialize(pkg) : pkg;
    }

    /**
     * Run a NPM script in this package's directory
     * @param {String} script NPM script to run
     * @param {Function} callback
     */

  }, {
    key: "runScript",
    value: function runScript(script, callback) {
      _npmlog2.default.silly("runScript", script, this.name);

      if (this.scripts[script]) {
        _NpmUtilities2.default.runScriptInDir(script, [], this.location, callback);
      } else {
        callback();
      }
    }

    /**
     * Run a NPM script synchronously in this package's directory
     * @param {String} script NPM script to run
     * @param {Function} callback
     */

  }, {
    key: "runScriptSync",
    value: function runScriptSync(script, callback) {
      _npmlog2.default.silly("runScriptSync", script, this.name);

      if (this.scripts[script]) {
        _NpmUtilities2.default.runScriptInDirSync(script, [], this.location, callback);
      } else {
        callback();
      }
    }

    /**
     * Determine if a dependency version satisfies the requirements of this package
     * @param {Package} dependency
     * @param {Boolean} doWarn
     * @returns {Boolean}
     */

  }, {
    key: "hasMatchingDependency",
    value: function hasMatchingDependency(dependency, doWarn) {
      _npmlog2.default.silly("hasMatchingDependency", this.name, dependency.name);

      var expectedVersion = this.allDependencies[dependency.name];
      var actualVersion = dependency.version;

      if (!expectedVersion) {
        return false;
      }

      // check if semantic versions are compatible
      if (_semver2.default.satisfies(actualVersion, expectedVersion)) {
        return true;
      }

      if (doWarn) {
        _npmlog2.default.warn(this.name, _dedent2.default`
        depends on "${dependency.name}@${expectedVersion}"
        instead of "${dependency.name}@${actualVersion}"
      `);
      }

      return false;
    }

    /**
     * Determine if a dependency has already been installed for this package
     * @param {String} depName Name of the dependency
     * @returns {Boolean}
     */

  }, {
    key: "hasDependencyInstalled",
    value: function hasDependencyInstalled(depName) {
      _npmlog2.default.silly("hasDependencyInstalled", this.name, depName);

      return (0, _dependencyIsSatisfied2.default)(this.nodeModulesLocation, depName, this.allDependencies[depName]);
    }
  }, {
    key: "name",
    get: function get() {
      return this._package.name;
    }
  }, {
    key: "location",
    get: function get() {
      return this._location;
    }
  }, {
    key: "nodeModulesLocation",
    get: function get() {
      return _path2.default.join(this._location, "node_modules");
    }
  }, {
    key: "version",
    get: function get() {
      return this._package.version;
    },
    set: function set(version) {
      this._package.version = version;
    }
  }, {
    key: "bin",
    get: function get() {
      return this._package.bin;
    }
  }, {
    key: "dependencies",
    get: function get() {
      return this._package.dependencies;
    }
  }, {
    key: "devDependencies",
    get: function get() {
      return this._package.devDependencies;
    }
  }, {
    key: "peerDependencies",
    get: function get() {
      return this._package.peerDependencies;
    }
  }, {
    key: "allDependencies",
    get: function get() {
      return Object.assign({}, this.devDependencies, this.dependencies);
    }
  }, {
    key: "scripts",
    get: function get() {
      return this._package.scripts || {};
    }
  }, {
    key: "versionSerializer",
    set: function set(versionSerializer) {
      this._versionSerializer = versionSerializer;

      if (versionSerializer) {
        this._package = versionSerializer.deserialize(this._package);
      }
    }
  }]);

  return Package;
}();

exports.default = Package;
module.exports = exports["default"];