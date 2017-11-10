"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _inquirer = require("inquirer");

var _inquirer2 = _interopRequireDefault(_inquirer);

var _npmlog = require("npmlog");

var _npmlog2 = _interopRequireDefault(_npmlog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PromptUtilities = function () {
  function PromptUtilities() {
    _classCallCheck(this, PromptUtilities);
  }

  _createClass(PromptUtilities, null, [{
    key: "confirm",
    value: function confirm(message, callback) {
      _npmlog2.default.pause();
      _inquirer2.default.prompt([{
        type: "expand",
        name: "confirm",
        message: message,
        default: 2, // default to help in order to avoid clicking straight through
        choices: [{ key: "y", name: "Yes", value: true }, { key: "n", name: "No", value: false }]
      }]).then(function (answers) {
        _npmlog2.default.resume();
        callback(answers.confirm);
      });
    }
  }, {
    key: "select",
    value: function select(message) {
      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          choices = _ref.choices,
          filter = _ref.filter,
          validate = _ref.validate;

      var callback = arguments[2];

      _npmlog2.default.pause();
      _inquirer2.default.prompt([{
        type: "list",
        name: "prompt",
        message: message,
        choices: choices,
        pageSize: choices.length,
        filter: filter,
        validate: validate
      }]).then(function (answers) {
        _npmlog2.default.resume();
        callback(answers.prompt);
      });
    }
  }, {
    key: "input",
    value: function input(message) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          filter = _ref2.filter,
          validate = _ref2.validate;

      var callback = arguments[2];

      _npmlog2.default.pause();
      _inquirer2.default.prompt([{
        type: "input",
        name: "input",
        message: message,
        filter: filter,
        validate: validate
      }]).then(function (answers) {
        _npmlog2.default.resume();
        callback(answers.input);
      });
    }
  }]);

  return PromptUtilities;
}();

exports.default = PromptUtilities;
module.exports = exports["default"];