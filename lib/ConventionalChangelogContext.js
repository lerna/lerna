'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Repository = require('./Repository');

var _Repository2 = _interopRequireDefault(_Repository);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var repository = new _Repository2.default(process.cwd());

exports.default = {
  version: repository.version
};
module.exports = exports['default'];