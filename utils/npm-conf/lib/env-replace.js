"use strict";

module.exports = envReplace;

// https://github.com/npm/npm/blob/latest/lib/config/core.js#L409-L423
function envReplace(str) {
  if (typeof str !== "string" || !str) {
    return str;
  }

  // Replace any ${ENV} values with the appropriate environment
  const regex = /(\\*)\$\{([^}]+)\}/g;

  return str.replace(regex, (orig, esc, name) => {
    // eslint-disable-next-line no-param-reassign
    esc = esc.length > 0 && esc.length % 2;

    if (esc) {
      return orig;
    }

    if (process.env[name] === undefined) {
      throw new Error(`Failed to replace env in config: ${orig}`);
    }

    return process.env[name];
  });
}
