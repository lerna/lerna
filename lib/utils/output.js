"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = output;

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function output() {
  var _console;

  _npmlog2.default.clearProgress();
  (_console = console).log.apply(_console, arguments);
  _npmlog2.default.showProgress();
}
module.exports = exports["default"];