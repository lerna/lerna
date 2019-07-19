"use strict";

const dotProp = require("dot-prop");
const log = require("npmlog");
const path = require("path");

module.exports = compose(
  // add new predicates HERE
  remap("command.version.githubRelease", "command.version.createRelease", {
    toValue: value => value && "github",
  }),
  remap("command.publish.githubRelease", "command.version.createRelease", {
    alsoRoot: true,
    toValue: value => value && "github",
  }),
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
 * @param {Function} opts.toValue Return the new config value given the current value
 * @return {Function} predicate accepting (config, filepath)
 */
function remap(search, target, { alsoRoot, toValue } = {}) {
  const pathsToSearch = [search];

  if (alsoRoot) {
    // root config is overwritten by "more specific" nested config
    pathsToSearch.unshift(search.split(".").pop());
  }

  return obj => {
    for (const searchPath of pathsToSearch) {
      if (dotProp.has(obj.config, searchPath)) {
        const fromVal = dotProp.get(obj.config, searchPath);
        const toVal = toValue ? toValue(fromVal) : fromVal;

        log.warn("project", deprecationMessage(obj, target, searchPath, fromVal, toVal));

        dotProp.set(obj.config, target, toVal);
        dotProp.delete(obj.config, searchPath);
      }
    }

    return obj;
  };
}

/**
 * Builds a deprecation message string that specifies
 * a deprecated config option and suggests a correction.
 *
 * @param {Object} obj A config object
 * @param {String} target Path of renamed option
 * @param {String} searchSearch Path to deprecated option
 * @param {Any} fromVal Current value of deprecated option
 * @param {Any} toVal Corrected value of deprecated option
 * @return {String} deprecation message
 */
function deprecationMessage(obj, target, searchPath, fromVal, toVal) {
  const localPath = path.relative(".", obj.filepath);

  let from;
  let to;
  if (toVal === fromVal) {
    from = `"${searchPath}"`;
    to = `"${target}"`;
  } else {
    from = stringify({ [searchPath]: fromVal });
    to = stringify({ [target]: toVal });
  }

  return `Deprecated key "${searchPath}" found in ${localPath}\nPlease update ${from} => ${to}`;
}

function stringify(obj) {
  return JSON.stringify(obj).slice(1, -1);
}

function compose(...funcs) {
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
