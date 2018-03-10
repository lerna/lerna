"use strict";

const multimatch = require("multimatch");

module.exports = isHoistedPackage;

function isHoistedPackage(name, hoisting) {
  return multimatch([name], hoisting).length > 0;
}
