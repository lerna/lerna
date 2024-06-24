/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";

module.exports = function spin(spinstr, spun) {
  return spinstr[spun % spinstr.length];
};
