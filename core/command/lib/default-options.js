"use strict";

module.exports.defaultOptions = defaultOptions;

// _.defaults(), but simplified:
//  * All inputs are plain objects
//  * Only own keys, not inherited
function defaultOptions(...sources) {
  const options = {};

  for (const source of sources) {
    if (source != null) {
      for (const key of Object.keys(source)) {
        if (options[key] === undefined) {
          options[key] = source[key];
        }
      }
    }
  }

  return options;
}
