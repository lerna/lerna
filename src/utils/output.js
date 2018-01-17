"use strict";

/* eslint-disable no-console */
const log = require("npmlog");

module.exports = output;

function output(...args) {
  log.clearProgress();
  console.log(...args);
  log.showProgress();
}
