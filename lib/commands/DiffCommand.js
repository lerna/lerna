"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _ChildProcessUtilities = require("../ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _GitUtilities = require("../GitUtilities");

var _GitUtilities2 = _interopRequireDefault(_GitUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new DiffCommand([argv.pkg], argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "diff [pkg]";

var describe = exports.describe = "Diff all packages or a single package since the last release.";

var builder = exports.builder = {};

function getLastCommit(execOpts) {
  if (_GitUtilities2.default.hasTags(execOpts)) {
    return _GitUtilities2.default.getLastTaggedCommit(execOpts);
  }

  return _GitUtilities2.default.getFirstCommit(execOpts);
}

var DiffCommand = function (_Command) {
  _inherits(DiffCommand, _Command);

  function DiffCommand() {
    _classCallCheck(this, DiffCommand);

    return _possibleConstructorReturn(this, (DiffCommand.__proto__ || Object.getPrototypeOf(DiffCommand)).apply(this, arguments));
  }

  _createClass(DiffCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var packageName = this.input[0];

      // don't interrupt spawned or streaming stdio
      this.logger.disableProgress();

      var targetPackage = void 0;

      if (packageName) {
        targetPackage = _lodash2.default.find(this.packages, function (pkg) {
          return pkg.name === packageName;
        });

        if (!targetPackage) {
          callback(new Error("Package '" + packageName + "' does not exist."));
          return;
        }
      }

      if (!_GitUtilities2.default.hasCommit(this.execOpts)) {
        callback(new Error("Can't diff. There are no commits in this repository, yet."));
        return;
      }

      this.args = ["diff", getLastCommit(this.execOpts), "--color=auto"];

      if (targetPackage) {
        this.args.push("--", targetPackage.location);
      } else {
        var _args;

        (_args = this.args).push.apply(_args, ["--"].concat(_toConsumableArray(this.repository.packageParentDirs)));
      }

      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      _ChildProcessUtilities2.default.spawn("git", this.args, this.execOpts, function (err) {
        if (err && err.code) {
          callback(err);
        } else {
          callback(null, true);
        }
      });
    }
  }]);

  return DiffCommand;
}(_Command3.default);

exports.default = DiffCommand;