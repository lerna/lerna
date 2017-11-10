"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _chalk = require("chalk");

var _chalk2 = _interopRequireDefault(_chalk);

var _events = require("events");

var _events2 = _interopRequireDefault(_events);

var _execa = require("execa");

var _execa2 = _interopRequireDefault(_execa);

var _strongLogTransformer = require("strong-log-transformer");

var _strongLogTransformer2 = _interopRequireDefault(_strongLogTransformer);

var _pFinally = require("p-finally");

var _pFinally2 = _interopRequireDefault(_pFinally);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Keep track of how many live children we have.
var children = 0;

// This is used to alert listeners when all children have exited.
var emitter = new _events2.default();

// when streaming children are spawned, use this color for prefix
var colorWheel = ["cyan", "magenta", "blue", "yellow", "green", "red"];
var NUM_COLORS = colorWheel.length;

var ChildProcessUtilities = function () {
  function ChildProcessUtilities() {
    _classCallCheck(this, ChildProcessUtilities);
  }

  _createClass(ChildProcessUtilities, null, [{
    key: "exec",
    value: function exec(command, args, opts, callback) {
      var options = Object.assign({}, opts);
      options.stdio = "pipe"; // node default

      return _spawn(command, args, options, callback);
    }
  }, {
    key: "execSync",
    value: function execSync(command, args, opts) {
      return _execa2.default.sync(command, args, opts).stdout;
    }
  }, {
    key: "spawn",
    value: function spawn(command, args, opts, callback) {
      var options = Object.assign({}, opts);
      options.stdio = "inherit";

      return _spawn(command, args, options, callback);
    }
  }, {
    key: "spawnStreaming",
    value: function spawnStreaming(command, args, opts, prefix, callback) {
      var options = Object.assign({}, opts);
      options.stdio = ["ignore", "pipe", "pipe"];

      var colorName = colorWheel[children % NUM_COLORS];
      var color = _chalk2.default[colorName];
      var spawned = _spawn(command, args, options, callback);

      var prefixedStdout = (0, _strongLogTransformer2.default)({ tag: `${color.bold(prefix)}:` });
      var prefixedStderr = (0, _strongLogTransformer2.default)({ tag: `${color(prefix)}:`, mergeMultiline: true });

      // Avoid "Possible EventEmitter memory leak detected" warning due to piped stdio
      if (children > process.stdout.listenerCount("close")) {
        process.stdout.setMaxListeners(children);
        process.stderr.setMaxListeners(children);
      }

      spawned.stdout.pipe(prefixedStdout).pipe(process.stdout);
      spawned.stderr.pipe(prefixedStderr).pipe(process.stderr);

      return spawned;
    }
  }, {
    key: "getChildProcessCount",
    value: function getChildProcessCount() {
      return children;
    }
  }, {
    key: "onAllExited",
    value: function onAllExited(callback) {
      emitter.on("empty", callback);
    }
  }]);

  return ChildProcessUtilities;
}();

exports.default = ChildProcessUtilities;


function registerChild(child) {
  children++;

  (0, _pFinally2.default)(child, function () {
    children--;

    if (children === 0) {
      emitter.emit("empty");
    }
  }).catch(function () {});
}

function _spawn(command, args, opts, callback) {
  var child = (0, _execa2.default)(command, args, opts);

  registerChild(child);

  if (callback) {
    child.then(function (result) {
      return callback(null, result.stdout);
    }, function (err) {
      return callback(err);
    });
  }

  return child;
}
module.exports = exports["default"];