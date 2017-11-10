"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.handler = handler;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _PublishCommand = require("./PublishCommand");

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _output = require("../utils/output");

var _output2 = _interopRequireDefault(_output);

var _UpdatedPackagesCollector = require("../UpdatedPackagesCollector");

var _UpdatedPackagesCollector2 = _interopRequireDefault(_UpdatedPackagesCollector);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var updatedOptions = _lodash2.default.assign({}, _PublishCommand.builder, {
  "json": {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined
  }
});

function handler(argv) {
  new UpdatedCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "updated";

var describe = exports.describe = "Check which packages have changed since the last publish.";

var builder = exports.builder = function builder(yargs) {
  return yargs.options(updatedOptions);
};

var UpdatedCommand = function (_Command) {
  _inherits(UpdatedCommand, _Command);

  function UpdatedCommand() {
    _classCallCheck(this, UpdatedCommand);

    return _possibleConstructorReturn(this, (UpdatedCommand.__proto__ || Object.getPrototypeOf(UpdatedCommand)).apply(this, arguments));
  }

  _createClass(UpdatedCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      var updatedPackagesCollector = new _UpdatedPackagesCollector2.default(this);
      this.updates = updatedPackagesCollector.getUpdates();

      var proceedWithUpdates = this.updates.length > 0;
      if (!proceedWithUpdates) {
        this.logger.info("No packages need updating");
      }

      callback(null, proceedWithUpdates, 1);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var updatedPackages = this.updates.map(function (update) {
        return update.package;
      }).map(function (pkg) {
        return {
          name: pkg.name,
          version: pkg.version,
          private: pkg.isPrivate()
        };
      });

      this.logger.info("result");
      if (this.options.json) {
        (0, _output2.default)(JSON.stringify(updatedPackages, null, 2));
      } else {
        var formattedUpdates = updatedPackages.map(function (pkg) {
          return `- ${pkg.name}${pkg.private ? ` (${_chalk2.default.red("private")})` : ""}`;
        }).join("\n");
        (0, _output2.default)(formattedUpdates);
      }

      callback(null, true);
    }
  }, {
    key: "otherCommandConfigs",
    get: function get() {
      return ["publish"];
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return Object.assign({}, _get(UpdatedCommand.prototype.__proto__ || Object.getPrototypeOf(UpdatedCommand.prototype), "defaultOptions", this), {
        json: false
      });
    }
  }]);

  return UpdatedCommand;
}(_Command3.default);

exports.default = UpdatedCommand;