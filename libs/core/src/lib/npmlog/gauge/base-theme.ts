/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";
import spin from "./spin";
import progressBar from "./progress-bar";

export const activityIndicator = function (values, theme) {
  if (values.spun == null) {
    return;
  }
  return spin(theme, values.spun);
};

export const progressbar = function (values, theme, width) {
  if (values.completed == null) {
    return;
  }
  return progressBar(theme, width, values.completed);
};

export default {
  activityIndicator,
  progressbar,
};
