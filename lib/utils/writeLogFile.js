"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = writeLogFile;

var _os = require("os");

var _os2 = _interopRequireDefault(_os);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _writeFileAtomic = require("write-file-atomic");

var _writeFileAtomic2 = _interopRequireDefault(_writeFileAtomic);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function writeLogFile(cwd) {
  var logOutput = "";

  _npmlog2.default.record.forEach(function (m) {
    var pref = [m.id, m.level];
    if (m.prefix) {
      pref.push(m.prefix);
    }
    pref = pref.join(" ");

    m.message.trim().split(/\r?\n/).map(function (line) {
      return (pref + " " + line).trim();
    }).forEach(function (line) {
      logOutput += line + _os2.default.EOL;
    });
  });

  _writeFileAtomic2.default.sync(_path2.default.join(cwd, "lerna-debug.log"), logOutput);

  // truncate log after writing
  _npmlog2.default.record.length = 0;
}
module.exports = exports["default"];