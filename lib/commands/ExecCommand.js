"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.handler = handler;

var _async = require("async");

var _async2 = _interopRequireDefault(_async);

var _ChildProcessUtilities = require("../ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _PackageUtilities = require("../PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function handler(argv) {
  new ExecCommand([argv.command].concat(_toConsumableArray(argv.args)), argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "exec <command> [args..]";

var describe = exports.describe = "Run an arbitrary command in each package.";

var builder = exports.builder = {
  "bail": {
    group: "Command Options:",
    describe: "Bail on exec execution when the command fails within a package",
    type: "boolean",
    default: undefined
  },
  "parallel": {
    group: "Command Options:",
    describe: "Run command in all packages with unlimited concurrency, streaming prefixed output",
    type: "boolean",
    default: undefined
  }
};

var ExecCommand = function (_Command) {
  _inherits(ExecCommand, _Command);

  function ExecCommand() {
    _classCallCheck(this, ExecCommand);

    return _possibleConstructorReturn(this, (ExecCommand.__proto__ || Object.getPrototypeOf(ExecCommand)).apply(this, arguments));
  }

  _createClass(ExecCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      this.command = this.input[0];
      this.args = this.input.slice(1);

      // don't interrupt spawned or streaming stdio
      this.logger.disableProgress();

      var filteredPackages = this.filteredPackages;


      try {
        this.batchedPackages = this.toposort ? _PackageUtilities2.default.topologicallyBatchPackages(filteredPackages, {
          rejectCycles: this.options.rejectCycles
        }) : [filteredPackages];
      } catch (e) {
        return callback(e);
      }

      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this2 = this;

      if (this.options.parallel) {
        this.runCommandInPackagesParallel(callback);
      } else {
        _PackageUtilities2.default.runParallelBatches(this.batchedPackages, function (pkg) {
          return function (done) {
            _this2.runCommandInPackage(pkg, done);
          };
        }, this.concurrency, callback);
      }
    }
  }, {
    key: "getOpts",
    value: function getOpts(pkg) {
      return {
        cwd: pkg.location,
        shell: true,
        env: Object.assign({}, process.env, {
          LERNA_PACKAGE_NAME: pkg.name,
          LERNA_ROOT_PATH: this.repository.rootPath
        }),
        reject: this.options.bail
      };
    }
  }, {
    key: "runCommandInPackagesParallel",
    value: function runCommandInPackagesParallel(callback) {
      var _this3 = this;

      this.logger.info("exec", "in %d package(s): %s", this.filteredPackages.length, [this.command].concat(this.args).join(" "));

      _async2.default.parallel(this.filteredPackages.map(function (pkg) {
        return function (done) {
          _ChildProcessUtilities2.default.spawnStreaming(_this3.command, _this3.args, _this3.getOpts(pkg), pkg.name, done);
        };
      }), callback);
    }
  }, {
    key: "runCommandInPackage",
    value: function runCommandInPackage(pkg, callback) {
      var _this4 = this;

      _ChildProcessUtilities2.default.spawn(this.command, this.args, this.getOpts(pkg), function (err) {
        if (err && err.code) {
          _this4.logger.error("exec", `Errored while executing '${err.cmd}' in '${pkg.name}'`);
        }
        callback(err);
      });
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return false;
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return Object.assign({}, _get(ExecCommand.prototype.__proto__ || Object.getPrototypeOf(ExecCommand.prototype), "defaultOptions", this), {
        bail: true,
        parallel: false
      });
    }
  }]);

  return ExecCommand;
}(_Command3.default);

exports.default = ExecCommand;