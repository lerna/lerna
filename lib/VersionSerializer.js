"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VersionSerializer = function () {
  function VersionSerializer(_ref) {
    var graphDependencies = _ref.graphDependencies,
        versionParser = _ref.versionParser;

    _classCallCheck(this, VersionSerializer);

    this._graphDependencies = graphDependencies;
    this._versionParser = versionParser;
    this._dependenciesKeys = ["dependencies", "devDependencies", "peerDependencies"];
    this._strippedPrefixes = new Map();
  }

  _createClass(VersionSerializer, [{
    key: "serialize",
    value: function serialize(pkg) {
      var _this = this;

      this._dependenciesKeys.forEach(function (key) {
        _this._prependPrefix(pkg[key] || {});
      });

      return pkg;
    }
  }, {
    key: "deserialize",
    value: function deserialize(pkg) {
      var _this2 = this;

      this._dependenciesKeys.forEach(function (key) {
        _this2._stripPrefix(pkg[key] || {});
      });

      return pkg;
    }
  }, {
    key: "_prependPrefix",
    value: function _prependPrefix(dependencies) {
      this._strippedPrefixes.forEach(function (prefix, name) {
        var version = dependencies[name];
        if (version) {
          dependencies[name] = `${prefix}${version}`;
        }
      });
    }
  }, {
    key: "_stripPrefix",
    value: function _stripPrefix(dependencies) {
      var _this3 = this;

      Object.keys(dependencies).forEach(function (name) {
        if (_this3._graphDependencies.includes(name)) {
          var result = _this3._versionParser.parseVersion(dependencies[name]);

          if (result.prefix) {
            dependencies[name] = result.version;
            _this3._strippedPrefixes.set(name, result.prefix);
          }
        }
      });
    }
  }]);

  return VersionSerializer;
}();

exports.default = VersionSerializer;
module.exports = exports["default"];