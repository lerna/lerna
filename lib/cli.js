"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = CLI;

var _dedent = require("dedent");

var _dedent2 = _interopRequireDefault(_dedent);

var _isCi = require("is-ci");

var _isCi2 = _interopRequireDefault(_isCi);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

var _yargs = require("yargs/yargs");

var _yargs2 = _interopRequireDefault(_yargs);

var _Command = require("./Command");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
Essentially a factory that returns a yargs() instance that can
be used to call parse() immediately (as in ../bin/lerna) or by
unit tests to encapsulate instantiation with "real" arguments.

@param {Array = []} argv
@param {String = process.cwd()} cwd
**/
function CLI(argv, cwd) {
  var cli = (0, _yargs2.default)(argv, cwd);

  // the options grouped under "Global Options:" header
  var globalKeys = Object.keys(_Command.builder).concat(["help", "version"]);

  if (_isCi2.default || !process.stderr.isTTY) {
    _npmlog2.default.disableColor();
    _npmlog2.default.disableProgress();
  } else if (process.stderr.isTTY) {
    _npmlog2.default.enableColor();
    _npmlog2.default.enableUnicode();
    _npmlog2.default.enableProgress();
  }

  return cli.usage("Usage: $0 <command> [options]").options(_Command.builder).group(globalKeys, "Global Options:").commandDir("../lib/commands").demandCommand(1, "Pass --help to see all available commands and options.").help("h").alias("h", "help").version().alias("v", "version").wrap(cli.terminalWidth()).showHelpOnFail(false, "A command is required.").epilogue(_dedent2.default`
      When a command fails, all logs are written to lerna-debug.log in the current working directory.

      For more information, find our manual at https://github.com/lerna/lerna
    `);
}
module.exports = exports["default"];