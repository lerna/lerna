"use strict";

/* eslint-disable no-console */
const log = require("npmlog");

module.exports.output = output;

// istanbul ignore next
function output(...args) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
