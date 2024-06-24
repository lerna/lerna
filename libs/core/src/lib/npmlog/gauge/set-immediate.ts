/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";
var process = require("./process");
try {
  module.exports = setImmediate;
} catch (ex) {
  module.exports = process.nextTick;
}
