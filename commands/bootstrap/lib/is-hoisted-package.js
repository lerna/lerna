"use strict";

const multimatch = require("multimatch");

module.exports.isHoistedPackage = isHoistedPackage;

/**
 * @param {string} name
 * @param {string[]} hoisting
 */
function isHoistedPackage(name, hoisting) {
  return multimatch([name], hoisting).length > 0;
}
