/* eslint-disable */
// @ts-nocheck

/**
 * Inlined from deprecated package https://github.com/npm/gauge/blob/f8092518a47ac6a96027ae3ad97d0251ffe7643b
 */

"use strict";

module.exports = function () {
  return ThemeSetProto.newThemeSet();
};

var ThemeSetProto = {};

ThemeSetProto.baseTheme = require("./base-theme.js");

ThemeSetProto.newTheme = function (parent, theme) {
  if (!theme) {
    theme = parent;
    parent = this.baseTheme;
  }
  return Object.assign({}, parent, theme);
};

ThemeSetProto.getThemeNames = function () {
  return Object.keys(this.themes);
};

ThemeSetProto.addTheme = function (name, parent, theme) {
  this.themes[name] = this.newTheme(parent, theme);
};

ThemeSetProto.addToAllThemes = function (theme) {
  var themes = this.themes;
  Object.keys(themes).forEach(function (name) {
    Object.assign(themes[name], theme);
  });
  Object.assign(this.baseTheme, theme);
};

ThemeSetProto.getTheme = function (name) {
  if (!this.themes[name]) {
    throw this.newMissingThemeError(name);
  }
  return this.themes[name];
};

ThemeSetProto.setDefault = function (opts, name) {
  if (name == null) {
    name = opts;
    opts = {};
  }
  var platform = opts.platform == null ? "fallback" : opts.platform;
  var hasUnicode = !!opts.hasUnicode;
  var hasColor = !!opts.hasColor;
  if (!this.defaults[platform]) {
    this.defaults[platform] = { true: {}, false: {} };
  }
  this.defaults[platform][hasUnicode][hasColor] = name;
};

ThemeSetProto.getDefault = function (opts) {
  if (!opts) {
    opts = {};
  }
  var platformName = opts.platform || process.platform;
  var platform = this.defaults[platformName] || this.defaults.fallback;
  var hasUnicode = !!opts.hasUnicode;
  var hasColor = !!opts.hasColor;
  if (!platform) {
    throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor);
  }
  if (!platform[hasUnicode][hasColor]) {
    if (hasUnicode && hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false;
    } else if (hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false;
    } else if (hasUnicode && hasColor && platform[!hasUnicode][!hasColor]) {
      hasUnicode = false;
      hasColor = false;
    } else if (hasUnicode && !hasColor && platform[!hasUnicode][hasColor]) {
      hasUnicode = false;
    } else if (!hasUnicode && hasColor && platform[hasUnicode][!hasColor]) {
      hasColor = false;
    } else if (platform === this.defaults.fallback) {
      throw this.newMissingDefaultThemeError(platformName, hasUnicode, hasColor);
    }
  }
  if (platform[hasUnicode][hasColor]) {
    return this.getTheme(platform[hasUnicode][hasColor]);
  } else {
    return this.getDefault(Object.assign({}, opts, { platform: "fallback" }));
  }
};

ThemeSetProto.newMissingThemeError = function newMissingThemeError(name) {
  var err = new Error('Could not find a gauge theme named "' + name + '"');
  Error.captureStackTrace.call(err, newMissingThemeError);
  err.theme = name;
  err.code = "EMISSINGTHEME";
  return err;
};

ThemeSetProto.newMissingDefaultThemeError = function newMissingDefaultThemeError(
  platformName,
  hasUnicode,
  hasColor
) {
  var err = new Error(
    "Could not find a gauge theme for your platform/unicode/color use combo:\n" +
      "    platform = " +
      platformName +
      "\n" +
      "    hasUnicode = " +
      hasUnicode +
      "\n" +
      "    hasColor = " +
      hasColor
  );
  Error.captureStackTrace.call(err, newMissingDefaultThemeError);
  err.platform = platformName;
  err.hasUnicode = hasUnicode;
  err.hasColor = hasColor;
  err.code = "EMISSINGTHEME";
  return err;
};

ThemeSetProto.newThemeSet = function () {
  var themeset = function (opts) {
    return themeset.getDefault(opts);
  };
  return Object.assign(themeset, ThemeSetProto, {
    themes: Object.assign({}, this.themes),
    baseTheme: Object.assign({}, this.baseTheme),
    defaults: JSON.parse(JSON.stringify(this.defaults || {})),
  });
};
