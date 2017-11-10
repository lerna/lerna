"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.handler = handler;

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _columnify = require("columnify");

var _columnify2 = _interopRequireDefault(_columnify);

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _output = require("../utils/output");

var _output2 = _interopRequireDefault(_output);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new LsCommand(argv._, argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "ls";

var describe = exports.describe = "List all public packages";

var builder = exports.builder = {
  "json": {
    describe: "Show information in JSON format",
    group: "Command Options:",
    type: "boolean",
    default: undefined
  }
};

var LsCommand = function (_Command) {
  _inherits(LsCommand, _Command);

  function LsCommand() {
    _classCallCheck(this, LsCommand);

    return _possibleConstructorReturn(this, (LsCommand.__proto__ || Object.getPrototypeOf(LsCommand)).apply(this, arguments));
  }

  _createClass(LsCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      // Nothing to do...
      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var formattedPackages = this.filteredPackages.map(function (pkg) {
        return {
          name: pkg.name,
          version: pkg.version,
          private: pkg.isPrivate()
        };
      });

      if (this.options.json) {
        (0, _output2.default)(JSON.stringify(formattedPackages, null, 2));
      } else {
        formattedPackages.forEach(function (pkg) {
          pkg.version = pkg.version ? _chalk2.default.grey(`v${pkg.version}`) : _chalk2.default.yellow("MISSING");
          pkg.private = pkg.private ? `(${_chalk2.default.red("private")})` : "";
        });
        (0, _output2.default)((0, _columnify2.default)(formattedPackages, {
          showHeaders: false,
          config: {
            version: {
              align: "right"
            }
          }
        }));
      }

      callback(null, true);
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return false;
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return Object.assign({}, _get(LsCommand.prototype.__proto__ || Object.getPrototypeOf(LsCommand.prototype), "defaultOptions", this), {
        json: false
      });
    }
  }]);

  return LsCommand;
}(_Command3.default);

exports.default = LsCommand;