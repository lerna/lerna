/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";
import process from "./process";

var exported: typeof setImmediate;
try {
  exported = setImmediate;
} catch (ex) {
  exported = process.nextTick;
}
export default exported;
