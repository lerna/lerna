"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = filterFlags;

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
Passed argv from yargs, return an object that contains _only_
what was passed on the command line, omitting undefined values
and yargs spam.
**/
function filterFlags(argv) {
  return _lodash2.default.omit(_lodash2.default.omitBy(argv, _lodash2.default.isNil), ["h", "help", "v", "version", "$0"]);
}
module.exports = exports["default"];