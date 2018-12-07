"use strict";

/* eslint-disable no-console */
const log = require("libnpm/log");

module.exports = output;

// istanbul ignore next
function output(...args) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
