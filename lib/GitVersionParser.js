"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require("lodash");

var _hostedGitInfo = require("hosted-git-info");

var _hostedGitInfo2 = _interopRequireDefault(_hostedGitInfo);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GitVersionParser = function () {
  function GitVersionParser() {
    var versionPrefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "v";

    _classCallCheck(this, GitVersionParser);

    this._gitUrlPattern = new RegExp(`(.+?#${(0, _lodash.escapeRegExp)(versionPrefix)})(.+)$`);
  }

  _createClass(GitVersionParser, [{
    key: "parseVersion",
    value: function parseVersion(version) {
      var gitInfo = _hostedGitInfo2.default.fromUrl(version);
      var targetMatches = void 0;

      if (gitInfo && gitInfo.committish) {
        targetMatches = this._gitUrlPattern.exec(version);
      }

      return {
        prefix: targetMatches ? targetMatches[1] : null,
        version: targetMatches ? targetMatches[2] : version
      };
    }
  }]);

  return GitVersionParser;
}();

exports.default = GitVersionParser;
module.exports = exports["default"];