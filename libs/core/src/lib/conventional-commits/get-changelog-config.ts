import npa from "npm-package-arg";
import log from "npmlog";
import pify from "pify";
import { ValidationError } from "../validation-error";
import { ChangelogPresetConfig } from "./constants";

const cfgCache = new Map();

function isFunction(config: any) {
  return Object.prototype.toString.call(config) === "[object Function]";
}

function resolveConfigPromise(presetPackageName: string, presetConfig: object) {
  log.verbose("getChangelogConfig", "Attempting to resolve preset %j", presetPackageName);

  // eslint-disable-next-line global-require, import/no-dynamic-require, @typescript-eslint/no-var-requires
  let config = require(presetPackageName);

  log.info("getChangelogConfig", "Successfully resolved preset %j", presetPackageName);

  if (isFunction(config)) {
    try {
      // try assuming config builder function first
      config = config(presetConfig);
    } catch (_) {
      // legacy presets export an errback function instead of Q.all()
      config = pify(config)();
    }
  }

  return config;
}

export function getChangelogConfig(
  changelogPreset: ChangelogPresetConfig = "conventional-changelog-angular",
  rootPath: string
) {
  const presetName = typeof changelogPreset === "string" ? changelogPreset : changelogPreset.name;
  const presetConfig = typeof changelogPreset === "object" ? changelogPreset : {};

  const cacheKey = `${presetName}${presetConfig ? JSON.stringify(presetConfig) : ""}`;

  let config = cfgCache.get(cacheKey);

  if (!config) {
    let presetPackageName = presetName;

    // https://github.com/npm/npm-package-arg#result-object
    const parsed = npa(presetPackageName, rootPath);

    log.verbose("getChangelogConfig", "using preset %j", presetPackageName);
    // catch allows missing file to pass without breaking chain
    // TODO: refactor to address type issues
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    log.silly("npa", parsed);

    if (parsed.type === "directory") {
      if (parsed.raw[0] === "@") {
        // npa parses scoped subpath reference as a directory
        parsed.name = parsed.raw;
        parsed.scope = parsed.raw.substring(0, parsed.raw.indexOf("/"));
        // un-scoped subpath shorthand handled in first catch block
      } else {
        // TODO: refactor to address type issues
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        presetPackageName = parsed.fetchSpec;
      }
      // catch allows missing file to pass without breaking chain
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
    } else if (parsed.type === "git" && parsed.hosted && parsed.hosted.default === "shortcut") {
      // probably a shorthand subpath, e.g. "foo/bar"
      parsed.name = parsed.raw;
    }

    // Maybe it doesn't need an implicit 'conventional-changelog-' prefix?
    try {
      config = resolveConfigPromise(presetPackageName, presetConfig);

      cfgCache.set(cacheKey, config);

      // early exit, yay
      return Promise.resolve(config);
    } catch (err) {
      // catch allows missing file to pass without breaking chain
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log.verbose("getChangelogConfig", err.message);
      log.info("getChangelogConfig", "Auto-prefixing conventional-changelog preset %j", presetName);

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
      config = resolveConfigPromise(presetPackageName, presetConfig);

      cfgCache.set(cacheKey, config);
    } catch (err) {
      // catch allows missing file to pass without breaking chain
      // TODO: refactor to address type issues
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      log.warn("getChangelogConfig", err.message);

      throw new ValidationError(
        "EPRESET",
        `Unable to load conventional-changelog preset '${presetName}'${
          presetName !== presetPackageName ? ` (${presetPackageName})` : ""
        }`
      );
    }
  }

  // the core presets are bloody Q.all() spreads
  return Promise.resolve(config);
}
