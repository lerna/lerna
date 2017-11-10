"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.handler = handler;

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _FileSystemUtilities = require("../FileSystemUtilities");

var _FileSystemUtilities2 = _interopRequireDefault(_FileSystemUtilities);

var _PromptUtilities = require("../PromptUtilities");

var _PromptUtilities2 = _interopRequireDefault(_PromptUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new CleanCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "clean";

var describe = exports.describe = "Remove the node_modules directory from all packages.";

var builder = exports.builder = {
  "yes": {
    group: "Command Options:",
    describe: "Skip all confirmation prompts"
  }
};

var CleanCommand = function (_Command) {
  _inherits(CleanCommand, _Command);

  function CleanCommand() {
    _classCallCheck(this, CleanCommand);

    return _possibleConstructorReturn(this, (CleanCommand.__proto__ || Object.getPrototypeOf(CleanCommand)).apply(this, arguments));
  }

  _createClass(CleanCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var _this2 = this;

      this.directoriesToDelete = this.filteredPackages.map(function (pkg) {
        return pkg.nodeModulesLocation;
      });

      if (this.options.yes) {
        callback(null, true);
      } else {
        this.logger.info("", `About to remove the following directories:\n${this.directoriesToDelete.map(function (dir) {
          return _path2.default.relative(_this2.repository.rootPath, dir);
        }).join("\n")}`);

        _PromptUtilities2.default.confirm("Proceed?", function (confirmed) {
          callback(null, confirmed);
        });
      }
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this3 = this;

      var tracker = this.logger.newItem("clean");
      tracker.addWork(this.directoriesToDelete.length);

      _async2.default.parallelLimit(this.directoriesToDelete.map(function (dirPath) {
        return function (cb) {
          tracker.info("clean", "removing", dirPath);

          _FileSystemUtilities2.default.rimraf(dirPath, function (err) {
            tracker.completeWork(1);
            cb(err);
          });
        };
      }), this.concurrency, function (err) {
        tracker.finish();

        if (err) {
          callback(err);
        } else {
          _this3.logger.success("clean", "finished");
          callback(null, true);
        }
      });
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return false;
    }
  }]);

  return CleanCommand;
}(_Command3.default);

exports.default = CleanCommand;