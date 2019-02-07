"use strict";

const dotProp = require("dot-prop");
const log = require("npmlog");
const path = require("path");

module.exports = compose(
  // add new predicates HERE
  remap("command.publish.npmTag", "command.publish.distTag", { alsoRoot: true }),
  remap("command.publish.cdVersion", "command.publish.bump", { alsoRoot: true }),
  remap("command.publish.ignore", "command.publish.ignoreChanges"),
  remap("commands", "command"),
  (config, filepath) => ({ config, filepath })
);

/**
 * Remap deprecated config properties, if they exist.
 * The returned predicate mutates the `config` parameter.
 *
 * @param {String} search Path to deprecated option
 * @param {String} target Path of renamed option
 * @param {Object} opts Optional configuration object
 * @param {Boolean} opts.alsoRoot Whether to check root config as well
 * @return {Function} predicate accepting (config, filepath)
 */
function remap(search, target, { alsoRoot } = {}) {
  const pathsToSearch = [search];

  if (alsoRoot) {
    // root config is overwritten by "more specific" nested config
    pathsToSearch.unshift(search.split(".").pop());
  }

  return obj => {
    for (const searchPath of pathsToSearch) {
      if (dotProp.has(obj.config, searchPath)) {
        const localPath = path.relative(".", obj.filepath);

        log.warn(
          "project",
          `Deprecated key "${searchPath}" found in ${localPath}\nPlease rename "${searchPath}" => "${target}"`
        );

        dotProp.set(obj.config, target, dotProp.get(obj.config, searchPath));
        dotProp.delete(obj.config, searchPath);
      }
    }

    return obj;
  };
}

function compose(...funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
