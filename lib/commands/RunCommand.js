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

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _NpmUtilities = require("../NpmUtilities");

var _NpmUtilities2 = _interopRequireDefault(_NpmUtilities);

var _output = require("../utils/output");

var _output2 = _interopRequireDefault(_output);

var _PackageUtilities = require("../PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function handler(argv) {
  new RunCommand([argv.script].concat(_toConsumableArray(argv.args)), argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "run <script> [args..]";

var describe = exports.describe = "Run an npm script in each package that contains that script.";

var builder = exports.builder = {
  "stream": {
    group: "Command Options:",
    describe: "Stream output with lines prefixed by package.",
    type: "boolean",
    default: undefined
  },
  "parallel": {
    group: "Command Options:",
    describe: "Run script in all packages with unlimited concurrency, streaming prefixed output",
    type: "boolean",
    default: undefined
  }
};

var RunCommand = function (_Command) {
  _inherits(RunCommand, _Command);

  function RunCommand() {
    _classCallCheck(this, RunCommand);

    return _possibleConstructorReturn(this, (RunCommand.__proto__ || Object.getPrototypeOf(RunCommand)).apply(this, arguments));
  }

  _createClass(RunCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var _this2 = this;

      this.script = this.input[0];
      this.args = this.input.slice(1);

      if (!this.script) {
        callback(new Error("You must specify which npm script to run."));
        return;
      }

      var filteredPackages = this.filteredPackages;


      if (this.script === "test" || this.script === "env") {
        this.packagesWithScript = filteredPackages;
      } else {
        this.packagesWithScript = filteredPackages.filter(function (pkg) {
          return pkg.scripts && pkg.scripts[_this2.script];
        });
      }

      if (!this.packagesWithScript.length) {
        this.logger.warn(`No packages found with the npm script '${this.script}'`);
      }

      if (this.options.parallel || this.options.stream) {
        // don't interrupt streaming stdio
        this.logger.disableProgress();
      }

      try {
        this.batchedPackages = this.toposort ? _PackageUtilities2.default.topologicallyBatchPackages(this.packagesWithScript, {
          rejectCycles: this.options.rejectCycles
        }) : [this.packagesWithScript];
      } catch (e) {
        return callback(e);
      }

      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var _this3 = this;

      var finish = function finish(err) {
        if (err) {
          callback(err);
        } else {
          if (_this3.packagesWithScript.length) {
            _this3.logger.success("run", `Ran npm script '${_this3.script}' in packages:`);
            _this3.logger.success("", _this3.packagesWithScript.map(function (pkg) {
              return `- ${pkg.name}`;
            }).join("\n"));
          }
          callback(null, true);
        }
      };

      if (this.options.parallel) {
        this.runScriptInPackagesParallel(finish);
      } else {
        this.runScriptInPackagesBatched(finish);
      }
    }
  }, {
    key: "runScriptInPackagesBatched",
    value: function runScriptInPackagesBatched(callback) {
      var _this4 = this;

      _PackageUtilities2.default.runParallelBatches(this.batchedPackages, function (pkg) {
        return function (done) {
          _this4.runScriptInPackage(pkg, done);
        };
      }, this.concurrency, callback);
    }
  }, {
    key: "runScriptInPackage",
    value: function runScriptInPackage(pkg, callback) {
      if (this.options.stream) {
        this.runScriptInPackageStreaming(pkg, callback);
      } else {
        this.runScriptInPackageCapturing(pkg, callback);
      }
    }
  }, {
    key: "runScriptInPackagesParallel",
    value: function runScriptInPackagesParallel(callback) {
      var _this5 = this;

      this.logger.info("run", "in %d package(s): npm run %s", this.packagesWithScript.length, [this.script].concat(this.args).join(" "));

      _async2.default.parallel(this.packagesWithScript.map(function (pkg) {
        return function (done) {
          _this5.runScriptInPackageStreaming(pkg, done);
        };
      }), callback);
    }
  }, {
    key: "runScriptInPackageStreaming",
    value: function runScriptInPackageStreaming(pkg, callback) {
      _NpmUtilities2.default.runScriptInPackageStreaming(this.script, this.args, pkg, callback);
    }
  }, {
    key: "runScriptInPackageCapturing",
    value: function runScriptInPackageCapturing(pkg, callback) {
      var _this6 = this;

      _NpmUtilities2.default.runScriptInDir(this.script, this.args, pkg.location, function (err, stdout) {
        if (err) {
          _this6.logger.error(_this6.script, `Errored while running script in '${pkg.name}'`);
        } else {
          (0, _output2.default)(stdout);
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
      return Object.assign({}, _get(RunCommand.prototype.__proto__ || Object.getPrototypeOf(RunCommand.prototype), "defaultOptions", this), {
        parallel: false,
        stream: false
      });
    }
  }]);

  return RunCommand;
}(_Command3.default);

exports.default = RunCommand;