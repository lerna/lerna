"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cmdShim = require("cmd-shim");

var _cmdShim2 = _interopRequireDefault(_cmdShim);

var _fsExtra = require("fs-extra");

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _pathExists = require("path-exists");

var _pathExists2 = _interopRequireDefault(_pathExists);

var _readCmdShim = require("read-cmd-shim");

var _readCmdShim2 = _interopRequireDefault(_readCmdShim);

var _ChildProcessUtilities = require("./ChildProcessUtilities");

var _ChildProcessUtilities2 = _interopRequireDefault(_ChildProcessUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ENDS_WITH_NEW_LINE = /\n$/;

function ensureEndsWithNewLine(string) {
  return ENDS_WITH_NEW_LINE.test(string) ? string : string + "\n";
}

// NOTE: if rimraf moves the location of its executable, this will need to be updated
var RIMRAF_CLI = require.resolve("rimraf/bin");

// globs only return directories with a trailing slash
function trailingSlash(filePath) {
  return _path2.default.normalize(`${filePath}/`);
}

var FileSystemUtilities = function () {
  function FileSystemUtilities() {
    _classCallCheck(this, FileSystemUtilities);
  }

  _createClass(FileSystemUtilities, null, [{
    key: "mkdirp",
    value: function mkdirp(filePath, callback) {
      _npmlog2.default.silly("mkdirp", filePath);
      _fsExtra2.default.ensureDir(filePath, callback);
    }
  }, {
    key: "mkdirpSync",
    value: function mkdirpSync(filePath) {
      _npmlog2.default.silly("mkdirpSync", filePath);
      _fsExtra2.default.ensureDirSync(filePath);
    }
  }, {
    key: "readdirSync",
    value: function readdirSync(filePath) {
      _npmlog2.default.silly("readdirSync", filePath);
      return _fsExtra2.default.readdirSync(filePath);
    }
  }, {
    key: "existsSync",
    value: function existsSync(filePath) {
      _npmlog2.default.silly("existsSync", filePath);
      return _pathExists2.default.sync(filePath);
    }
  }, {
    key: "writeFile",
    value: function writeFile(filePath, fileContents, callback) {
      _npmlog2.default.silly("writeFile", [filePath, fileContents]);
      _fsExtra2.default.writeFile(filePath, ensureEndsWithNewLine(fileContents), callback);
    }
  }, {
    key: "rename",
    value: function rename(from, to, callback) {
      _npmlog2.default.silly("rename", [from, to]);
      _fsExtra2.default.rename(from, to, callback);
    }
  }, {
    key: "renameSync",
    value: function renameSync(from, to) {
      _npmlog2.default.silly("renameSync", [from, to]);
      _fsExtra2.default.renameSync(from, to);
    }
  }, {
    key: "writeFileSync",
    value: function writeFileSync(filePath, fileContents) {
      _npmlog2.default.silly("writeFileSync", [filePath, fileContents]);
      _fsExtra2.default.writeFileSync(filePath, ensureEndsWithNewLine(fileContents));
    }
  }, {
    key: "readFileSync",
    value: function readFileSync(filePath) {
      _npmlog2.default.silly("readFileSync", filePath);
      return _fsExtra2.default.readFileSync(filePath, "utf8").trim();
    }
  }, {
    key: "statSync",
    value: function statSync(filePath) {
      _npmlog2.default.silly("statSync", filePath);
      return _fsExtra2.default.statSync(filePath);
    }
  }, {
    key: "rimraf",
    value: function rimraf(dirPath, callback) {
      _npmlog2.default.silly("rimraf", dirPath);
      // Shelling out to a child process for a noop is expensive.
      // Checking if `dirPath` exists to be removed is cheap.
      // This lets us short-circuit if we don't have anything to do.

      return (0, _pathExists2.default)(dirPath).then(function (exists) {
        if (!exists) {
          return callback();
        }

        var args = [RIMRAF_CLI, "--no-glob", trailingSlash(dirPath)];

        // We call this resolved CLI path in the "path/to/node path/to/cli <..args>"
        // pattern to avoid Windows hangups with shebangs (e.g., WSH can't handle it)
        return _ChildProcessUtilities2.default.spawn(process.execPath, args, {}, function (err) {
          _npmlog2.default.verbose("rimraf", "removed", dirPath);
          callback(err);
        });
      });
    }
  }, {
    key: "symlink",
    value: function symlink(src, dest, type, callback) {
      _npmlog2.default.silly("symlink", [src, dest, type]);
      if (process.platform === "win32") {
        createWindowsSymlink(src, dest, type, callback);
      } else {
        createPosixSymlink(src, dest, type, callback);
      }
    }
  }, {
    key: "unlinkSync",
    value: function unlinkSync(filePath) {
      _npmlog2.default.silly("unlinkSync", filePath);
      _fsExtra2.default.unlinkSync(filePath);
    }
  }, {
    key: "isSymlink",
    value: function isSymlink(filePath) {
      _npmlog2.default.silly("isSymlink", filePath);
      var result = void 0;

      if (process.platform === "win32") {
        result = resolveWindowsSymlink(filePath);
      } else {
        result = resolvePosixSymlink(filePath);
      }

      _npmlog2.default.verbose("isSymlink", [filePath, result]);
      return result;
    }
  }]);

  return FileSystemUtilities;
}();

exports.default = FileSystemUtilities;


function createSymbolicLink(src, dest, type, callback) {
  _npmlog2.default.silly("createSymbolicLink", [src, dest, type]);
  _fsExtra2.default.lstat(dest, function (err) {
    if (!err) {
      // Something exists at `dest`.  Need to remove it first.
      _fsExtra2.default.unlink(dest, function () {
        return _fsExtra2.default.symlink(src, dest, type, callback);
      });
    } else {
      _fsExtra2.default.symlink(src, dest, type, callback);
    }
  });
}

function createPosixSymlink(origin, dest, type, callback) {
  if (type === "exec") {
    type = "file";
  }
  var src = _path2.default.relative(_path2.default.dirname(dest), origin);
  createSymbolicLink(src, dest, type, callback);
}

function createWindowsSymlink(src, dest, type, callback) {
  if (type === "exec") {
    (0, _cmdShim2.default)(src, dest, callback);
  } else {
    createSymbolicLink(src, dest, type, callback);
  }
}

function resolveSymbolicLink(filePath) {
  var lstat = _fsExtra2.default.lstatSync(filePath);
  var isSymlink = lstat.isSymbolicLink() ? _path2.default.resolve(_path2.default.dirname(filePath), _fsExtra2.default.readlinkSync(filePath)) : false;

  return {
    isSymlink,
    lstat
  };
}

function resolvePosixSymlink(filePath) {
  var _resolveSymbolicLink = resolveSymbolicLink(filePath),
      isSymlink = _resolveSymbolicLink.isSymlink;

  return isSymlink;
}

function resolveWindowsSymlink(filePath) {
  var _resolveSymbolicLink2 = resolveSymbolicLink(filePath),
      isSymlink = _resolveSymbolicLink2.isSymlink,
      lstat = _resolveSymbolicLink2.lstat;

  if (lstat.isFile() && !isSymlink) {
    try {
      return _path2.default.resolve(_path2.default.dirname(filePath), _readCmdShim2.default.sync(filePath));
    } catch (e) {
      return false;
    }
  }

  return isSymlink && _path2.default.resolve(isSymlink);
}
module.exports = exports["default"];