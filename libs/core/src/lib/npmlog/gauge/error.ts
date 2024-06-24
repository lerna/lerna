/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";
var util = require("util");

var User = (exports.User = function User(msg) {
  var err = new Error(msg);
  Error.captureStackTrace(err, User);
  err.code = "EGAUGE";
  return err;
});

exports.MissingTemplateValue = function MissingTemplateValue(item, values) {
  var err = new User(util.format('Missing template value "%s"', item.type));
  Error.captureStackTrace(err, MissingTemplateValue);
  err.template = item;
  err.values = values;
  return err;
};

exports.Internal = function Internal(msg) {
  var err = new Error(msg);
  Error.captureStackTrace(err, Internal);
  err.code = "EGAUGEINTERNAL";
  return err;
};
