"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.builder = exports.describe = exports.command = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

exports.handler = handler;

var _Command2 = require("../Command");

var _Command3 = _interopRequireDefault(_Command2);

var _PackageUtilities = require("../PackageUtilities");

var _PackageUtilities2 = _interopRequireDefault(_PackageUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function handler(argv) {
  new LinkCommand([argv.pkg], argv, argv._cwd).run().then(argv._onFinish, argv._onFinish);
}

var command = exports.command = "link";

var describe = exports.describe = "Symlink together all packages which are dependencies of each other";

var builder = exports.builder = {
  "force-local": {
    group: "Command Options:",
    describe: "Force local",
    type: "boolean",
    default: undefined
  }
};

var LinkCommand = function (_Command) {
  _inherits(LinkCommand, _Command);

  function LinkCommand() {
    _classCallCheck(this, LinkCommand);

    return _possibleConstructorReturn(this, (LinkCommand.__proto__ || Object.getPrototypeOf(LinkCommand)).apply(this, arguments));
  }

  _createClass(LinkCommand, [{
    key: "initialize",
    value: function initialize(callback) {
      callback(null, true);
    }
  }, {
    key: "execute",
    value: function execute(callback) {
      var packages = this.packages,
          packageGraph = this.packageGraph,
          logger = this.logger,
          forceLocal = this.options.forceLocal;

      _PackageUtilities2.default.symlinkPackages(packages, packageGraph, logger, forceLocal, callback);
    }
  }, {
    key: "requiresGit",
    get: function get() {
      return false;
    }
  }, {
    key: "defaultOptions",
    get: function get() {
      return Object.assign({}, _get(LinkCommand.prototype.__proto__ || Object.getPrototypeOf(LinkCommand.prototype), "defaultOptions", this), {
        forceLocal: false
      });
    }
  }]);

  return LinkCommand;
}(_Command3.default);

exports.default = LinkCommand;