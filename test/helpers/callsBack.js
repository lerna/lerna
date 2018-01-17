"use strict";

module.exports = callsBack;

// for mocking the behaviour of methods that accept a callback
function callsBack(err, val) {
  return (...args) => args.pop()(err, val);
}
