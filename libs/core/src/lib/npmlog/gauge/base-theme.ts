/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

'use strict'
var spin = require('./spin.js')
var progressBar = require('./progress-bar.js')

module.exports = {
  activityIndicator: function (values, theme) {
    if (values.spun == null) {
      return
    }
    return spin(theme, values.spun)
  },
  progressbar: function (values, theme, width) {
    if (values.completed == null) {
      return
    }
    return progressBar(theme, width, values.completed)
  },
}
