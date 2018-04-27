"use strict";

const path = require("path");
const resolveFrom = require("resolve-from");
const ValidationError = require("@lerna/validation-error");
const deprecateConfig = require("./deprecate-config");
const shallowExtend = require("./shallow-extend");

module.exports = applyExtends;

function applyExtends(config, cwd, seen = new Set()) {
  let defaultConfig = {};

  if ("extends" in config) {
    let pathToDefault;

    try {
      pathToDefault = resolveFrom(cwd, config.extends);
    } catch (err) {
      throw new ValidationError("ERESOLVED", "Config .extends must be locally-resolvable", err);
    }

    if (seen.has(pathToDefault)) {
      throw new ValidationError("ECIRCULAR", "Config .extends cannot be circular", seen);
    }

    seen.add(pathToDefault);

    // eslint-disable-next-line import/no-dynamic-require, global-require
    defaultConfig = require(pathToDefault);
    delete config.extends; // eslint-disable-line no-param-reassign

    deprecateConfig(defaultConfig, pathToDefault);

    defaultConfig = applyExtends(defaultConfig, path.dirname(pathToDefault), seen);
  }

  return shallowExtend(config, defaultConfig);
}
