"use strict";

const dotProp = require("dot-prop");
const log = require("npmlog");
const path = require("path");

module.exports = compose(
  // add new predicates HERE
  remap("command.publish.cdVersion", "command.publish.bump"),
  remap("command.publish.ignore", "command.publish.ignoreChanges"),
  remap("commands", "command"),
  (config, filepath) => ({ config, filepath })
);

/**
 * Remap deprecated config properties, if they exist.
 * The returned predicate mutates the `config` parameter.
 *
 * @param {String} search Path to deprecated option
 * @param {String} replace Path of renamed option
 * @return {Function} predicate accepting (config, filepath)
 */
function remap(search, replace) {
  return obj => {
    if (dotProp.has(obj.config, search)) {
      const localPath = path.relative(".", obj.filepath);

      log.warn(
        "project",
        `Deprecated key "${search}" found in ${localPath}\nPlease rename "${search}" => "${replace}"`
      );

      dotProp.set(obj.config, replace, dotProp.get(obj.config, search));
      dotProp.delete(obj.config, search);
    }

    return obj;
  };
}

function compose(...funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
