"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = dependencyIsSatisfied;

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _readPkg = require("read-pkg");

var _readPkg2 = _interopRequireDefault(_readPkg);

var _semver = require("semver");

var _semver2 = _interopRequireDefault(_semver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function dependencyIsSatisfied(dir, depName, needVersion) {
  _npmlog2.default.silly("dependencyIsSatisfied", [depName, needVersion, dir]);

  var retVal = void 0;
  try {
    var pkg = _readPkg2.default.sync(_path2.default.join(dir, depName, "package.json"), { normalize: false });
    retVal = _semver2.default.satisfies(pkg.version, needVersion);
  } catch (e) {
    retVal = false;
  }

  _npmlog2.default.verbose("dependencyIsSatisfied", depName, retVal);
  return retVal;
}
module.exports = exports["default"];