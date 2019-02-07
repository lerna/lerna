"use strict";

const log = require("npmlog");
const npa = require("npm-package-arg");
const pify = require("pify");
const ValidationError = require("@lerna/validation-error");

module.exports = getChangelogConfig;

const cfgCache = new Map();

function isFunction(config) {
  return Object.prototype.toString.call(config) === "[object Function]";
}

function resolveConfigPromise(presetPackageName) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  let config = require(presetPackageName);

  // legacy presets export an errback function instead of Q.all()
  if (isFunction(config)) {
    config = pify(config)();
  }

  return config;
}

function getChangelogConfig(changelogPreset = "conventional-changelog-angular", rootPath) {
  let config = cfgCache.get(changelogPreset);

  if (!config) {
    let presetPackageName = changelogPreset;

    // https://github.com/npm/npm-package-arg#result-object
    const parsed = npa(presetPackageName, rootPath);

    if (parsed.type === "directory") {
      if (parsed.raw[0] === "@") {
        // npa parses scoped subpath reference as a directory
        parsed.name = parsed.raw;
        parsed.scope = parsed.raw.substring(0, parsed.raw.indexOf("/"));
        // un-scoped subpath shorthand handled in first catch block
      } else {
        presetPackageName = parsed.fetchSpec;
      }
    } else if (parsed.type === "git" && parsed.hosted && parsed.hosted.default === "shortcut") {
      // probably a shorthand subpath, e.g. "foo/bar"
      parsed.name = parsed.raw;
    }

    // Maybe it doesn't need an implicit 'conventional-changelog-' prefix?
    try {
      config = resolveConfigPromise(presetPackageName);

      cfgCache.set(changelogPreset, config);

      // early exit, yay
      return Promise.resolve(config);
    } catch (err) {
      log.verbose("getChangelogConfig", err.message);
      log.info("getChangelogConfig", `Auto-prefixing conventional-commits preset '${changelogPreset}'`);

      // probably a deep shorthand subpath :P
      parsed.name = parsed.raw;
    }

    if (parsed.name.indexOf("conventional-changelog-") < 0) {
      // implicit 'conventional-changelog-' prefix
      const parts = parsed.name.split("/");
      const start = parsed.scope ? 1 : 0;

      //        foo =>        conventional-changelog-foo
      // @scope/foo => @scope/conventional-changelog-foo
      parts.splice(start, 1, `conventional-changelog-${parts[start]}`);

      // _technically_ supports 'foo/lib/bar.js', but that's gross
      presetPackageName = parts.join("/");
    }

    try {
      config = resolveConfigPromise(presetPackageName);

      cfgCache.set(changelogPreset, config);
    } catch (err) {
      log.warn("getChangelogConfig", err.message);

      throw new ValidationError(
        "EPRESET",
        `Unable to load conventional-commits preset '${changelogPreset}'${
          changelogPreset !== presetPackageName ? ` (${presetPackageName})` : ""
        }`
      );
    }
  }

  // the core presets are bloody Q.all() spreads
  return Promise.resolve(config);
}
